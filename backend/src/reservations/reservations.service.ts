import {
  BadRequestException, ConflictException, HttpException, HttpStatus,
  Injectable, ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ReservationRequestDto } from "./reservation-request.dto.js";

const MIN_LEAD_MS = 60 * 60 * 1000;
const MAX_FUTURE_MS = 60 * 24 * 60 * 60 * 1000;
const RECENT_WINDOW_MS = 60 * 60 * 1000;
const MAX_RECENT_REQUESTS = 3;

// First customer operates in Uganda (UTC+03:00 year-round).
// Store UTC + original local date/time/timezone for future multi-timezone support.
export function localVisitToUTC(date: string, time: string, now = new Date()): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new BadRequestException("Enter a valid date and time");
  }
  const parts = date.split("-").map(Number);
  if (parts[0] < 2020 || parts[0] > 2100 ||
      new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).toISOString().slice(0, 10) !== date) {
    throw new BadRequestException("Enter a valid calendar date");
  }
  const timestamp = Date.parse(`${date}T${time}:00+03:00`);
  if (!Number.isFinite(timestamp) || timestamp - now.getTime() < MIN_LEAD_MS ||
      timestamp - now.getTime() > MAX_FUTURE_MS) {
    throw new BadRequestException("Choose a date between 1 hour and 60 days ahead");
  }
  return new Date(timestamp);
}
function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/[\s()-]/g, "");
  if (!/^\+?[0-9]{9,15}$/.test(cleaned)) {
    throw new BadRequestException("Enter a valid phone number");
  }
  return cleaned;
}

@Injectable()
export class ReservationsService {
  constructor(private readonly db: PrismaService, private readonly config: ConfigService) {}

  private async eligibleRestaurant(slug: string) {
    if (!/^[a-z0-9-]{2,80}$/.test(slug)) return null;
    const restaurant = await this.db.restaurant.findUnique({
      where: { slug },
      include: { organization: { select: { active: true } } },
    });
    return restaurant?.published && restaurant.reservationRequestsEnabled &&
      restaurant.organization.active ? restaurant : null;
  }

  async publicConfig(slug: string) {
    const enabled = this.config.get<string>("RESERVATION_REQUESTS_MODE") === "enabled" &&
      Boolean(await this.eligibleRestaurant(slug));
    return {
      acceptingRequests: enabled,
      bookingConfirmedAutomatically: false,
      timeZone: "Africa/Kampala",
      message: enabled
        ? "Requests are reviewed by McKanim staff; a table is not confirmed until they contact you."
        : "Online reservation requests are not yet available. Please do not assume a booking has been made.",
    };
  }

  async submit(slug: string, input: ReservationRequestDto) {
    if (this.config.get<string>("RESERVATION_REQUESTS_MODE") !== "enabled") {
      throw new ServiceUnavailableException("Reservation requests are not enabled");
    }
    const restaurant = await this.eligibleRestaurant(slug);
    if (!restaurant) throw new ServiceUnavailableException("Reservation requests are not available");
    if (input.website?.trim()) throw new BadRequestException("Invalid form submission");

    const guestName = input.guestName?.trim();
    if (!guestName || guestName.length < 2 || guestName.length > 120) {
      throw new BadRequestException("Enter your name");
    }
    const guestPhone = normalizePhone(input.guestPhone);
    const guestEmail = input.guestEmail?.trim().toLowerCase() || null;
    const notes = input.notes?.trim() || null;
    const requestedFor = localVisitToUTC(input.visitDate, input.visitTime);
    const requestHash = createHash("sha256").update(JSON.stringify({
      restaurantId: restaurant.id, guestName, guestPhone, guestEmail,
      visitDate: input.visitDate, visitTime: input.visitTime,
      partySize: input.partySize, notes,
    })).digest("hex");

    const existing = await this.db.reservationRequest.findUnique({
      where: { restaurantId_idempotencyKey: { restaurantId: restaurant.id, idempotencyKey: input.idempotencyKey } },
    });
    if (existing) {
      if (existing.requestHash !== requestHash) throw new ConflictException("Request key was already used");
      return this.receipt(existing.id, existing.status);
    }

    const recent = await this.db.reservationRequest.count({
      where: {
        restaurantId: restaurant.id, guestPhone,
        createdAt: { gte: new Date(Date.now() - RECENT_WINDOW_MS) },
      },
    });
    if (recent >= MAX_RECENT_REQUESTS) {
      throw new HttpException("Too many requests. Try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    try {
      const created = await this.db.reservationRequest.create({
        data: {
          restaurantId: restaurant.id,
          idempotencyKey: input.idempotencyKey,
          requestHash, guestName, guestPhone, guestEmail, notes,
          visitDate: input.visitDate, visitTime: input.visitTime,
          requestedFor, partySize: input.partySize, timeZone: "Africa/Kampala",
          status: "PENDING_REVIEW",
        },
        select: { id: true, status: true },
      });
      return this.receipt(created.id, created.status);
    } catch (error) {
      // Unique index protects against simultaneous retries of the same request.
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        const duplicate = await this.db.reservationRequest.findUnique({
          where: { restaurantId_idempotencyKey: { restaurantId: restaurant.id, idempotencyKey: input.idempotencyKey } },
        });
        if (duplicate && duplicate.requestHash === requestHash) {
          return this.receipt(duplicate.id, duplicate.status);
        }
        throw new ConflictException("Request key was already used");
      }
      throw error;
    }
  }

  private receipt(id: string, status: string) {
    return {
      reference: id,
      status,
      confirmed: status === "CONFIRMED",
      message: status === "PENDING_REVIEW"
        ? "Your request was recorded for staff review. This is NOT a confirmed reservation."
        : "Request status has changed; contact the restaurant for details.",
    };
  }
}
