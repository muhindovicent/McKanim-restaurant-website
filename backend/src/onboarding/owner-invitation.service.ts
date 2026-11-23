import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { hashOwnerPassword, validateOwnerPassword } from "../auth/password.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateEmail(email: unknown): string {
  if (typeof email !== "string") throw new BadRequestException("Invalid email address");
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 255) {
    throw new BadRequestException("Invalid email address");
  }
  return value;
}
function tokenHash(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

@Injectable()
export class OwnerInvitationService {
  constructor(private readonly db: PrismaService) {}

  /**
   * INTERNAL-ONLY. Only an authenticated and authorized platform operator may
   * eventually call this from a guarded administrative workflow.
   * No public invite-creation HTTP endpoint or email provider is wired.
   * Raw tokens MUST NOT be logged, persisted, or exposed in API responses.
   */
  async issueOwnerInvitation(restaurantId: string, email: string) {
    if (!UUID_PATTERN.test(restaurantId)) throw new BadRequestException("Invalid restaurant identifier");
    const normalizedEmail = validateEmail(email);
    const rawToken = randomBytes(32).toString("base64url");
    const hashed = tokenHash(rawToken);
    const expiresAt = new Date(Date.now() + ONE_DAY_MS);

    await this.db.$transaction(async tx => {
      // Lock the restaurant so competing invitations for the same restaurant
      // serialize before revoking/replacing outstanding invites.
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM restaurants WHERE id = ${restaurantId}::uuid FOR UPDATE
      `;
      if (!rows.length) throw new NotFoundException("Restaurant not found");
      const existing = await tx.staffUser.findUnique({
        where: { restaurantId_email: { restaurantId, email: normalizedEmail } },
        select: { id: true },
      });
      if (existing) throw new ConflictException("This account is already registered");

      await tx.ownerInvitation.updateMany({
        where: { restaurantId, email: normalizedEmail, usedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.ownerInvitation.create({
        data: { restaurantId, email: normalizedEmail, tokenHash: hashed, expiresAt },
      });
    });

    // Deliver only via a verified, HTTPS-link email provider once integrated.
    // This secret is returned to a trusted internal caller ONLY, never to a browser.
    return { email: normalizedEmail, rawToken, expiresAt };
  }

  /**
   * Can be called later by a rate-limited invitation redemption handler.
   * No route is currently exposed. Consumes a token atomically with user creation.
   */
  async redeemOwnerInvitation(input: { rawToken: string; password: string; displayName: string }) {
    const { rawToken, password, displayName } = input;
    if (typeof rawToken !== "string" || !TOKEN_PATTERN.test(rawToken)) {
      throw new BadRequestException("Invalid or expired invitation");
    }
    const name = typeof displayName === "string" ? displayName.trim() : "";
    if (name.length < 2 || name.length > 120) throw new BadRequestException("Invalid account name");
    try {
      validateOwnerPassword(password);
    } catch {
      throw new BadRequestException("Password must contain at least 12 characters");
    }

    // Expensive scrypt work must happen OUTSIDE the DB transaction.
    const passwordHash = await hashOwnerPassword(password);
    const digest = tokenHash(rawToken);

    return this.db.$transaction(async tx => {
      const now = new Date();
      const consumed = await tx.ownerInvitation.updateMany({
        where: { tokenHash: digest, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) throw new BadRequestException("Invalid or expired invitation");

      const invite = await tx.ownerInvitation.findUniqueOrThrow({
        where: { tokenHash: digest },
        select: { restaurantId: true, email: true },
      });
      const existing = await tx.staffUser.findUnique({
        where: { restaurantId_email: { restaurantId: invite.restaurantId, email: invite.email } },
        select: { id: true },
      });
      if (existing) throw new ConflictException("Invitation is no longer valid");

      const account = await tx.staffUser.create({
        data: {
          restaurantId: invite.restaurantId,
          email: invite.email,
          name,
          passwordHash,
          role: "OWNER",
          active: true,
        },
        select: { id: true, restaurantId: true, role: true, active: true },
      });
      return account;
    });
  }
}
