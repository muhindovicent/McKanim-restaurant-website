import { Controller, Get, Param } from "@nestjs/common";
import { PublicMenuService } from "./public-menu.service.js";

@Controller("public/restaurants")
export class PublicMenuController {
  constructor(private readonly menu: PublicMenuService) {}

  @Get(":restaurantSlug/menu")
  getMenu(@Param("restaurantSlug") restaurantSlug: string) {
    return this.menu.getPublishedMenu(restaurantSlug);
  }
}
