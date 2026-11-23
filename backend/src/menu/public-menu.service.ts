import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class PublicMenuService {
  constructor(private readonly db: PrismaService) {}

  async getPublishedMenu(slug: string) {
    if (!/^[a-z0-9-]{2,80}$/.test(slug)) throw new BadRequestException("Invalid restaurant slug");
    const restaurant = await this.db.restaurant.findUnique({
      where: { slug },
      select: {
        slug: true, currency: true, published: true, updatedAt: true,
        organization: { select: { active: true } },
        menuItems: {
          where: { published: true, available: true },
          select: {
            id: true, name: true, description: true, priceUGX: true,
            available: true, imageUrl: true, updatedAt: true,
            category: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    });
    // Never disclose unpublished restaurants or unapproved menu content.
    if (!restaurant || !restaurant.published || !restaurant.organization.active) throw new NotFoundException("Menu not available");
    const latest = restaurant.menuItems.reduce(
      (previous, item) => item.updatedAt > previous ? item.updatedAt : previous,
      restaurant.updatedAt,
    );
    return {
      restaurantSlug: restaurant.slug,
      currency: "UGX" as const,
      menuVersion: latest.toISOString(),
      items: restaurant.menuItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category.name,
        priceUGX: item.priceUGX,
        available: item.available,
        ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
      })),
    };
  }
}
