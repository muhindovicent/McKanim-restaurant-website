import { Body, Controller, Get, Header, HttpCode, Param, Post } from "@nestjs/common";
import { ReservationRequestDto } from "./reservation-request.dto.js";
import { ReservationsService } from "./reservations.service.js";

@Controller("public/restaurants/:restaurantSlug/reservation-requests")
@Header("Cache-Control", "no-store")
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get("config")
  getConfiguration(@Param("restaurantSlug") slug: string) {
    return this.reservations.publicConfig(slug);
  }

  @Post()
  @HttpCode(202)
  submit(@Param("restaurantSlug") slug: string, @Body() body: ReservationRequestDto) {
    return this.reservations.submit(slug, body);
  }
}
