import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

type DatabaseReadiness = {
  installedMigrations: bigint;
  organizations: string | null;
  restaurants: string | null;
  menuItems: string | null;
  ownerInvitations: string | null;
  reservations: string | null;
};

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("live")
  live() {
    return { status: "alive" };
  }

  @Get("ready")
  async ready() {
    try {
      // SELECT 1 alone is insufficient: an empty PostgreSQL database can
      // answer it while the restaurant application schema is missing.
      const result = await this.prisma.$queryRaw<DatabaseReadiness[]>`
        SELECT
          (
            SELECT count(*) FROM "_prisma_migrations"
            WHERE migration_name = '0_init'
              AND finished_at IS NOT NULL
              AND rolled_back_at IS NULL
          ) AS "installedMigrations",
          to_regclass('public.organizations')::text AS organizations,
          to_regclass('public.restaurants')::text AS restaurants,
          to_regclass('public.menu_items')::text AS "menuItems",
          to_regclass('public.owner_invitations')::text AS "ownerInvitations",
          to_regclass('public.reservation_requests')::text AS reservations
      `;
      const state = result[0];
      if (!state || state.installedMigrations < 1n ||
          !state.organizations || !state.restaurants ||
          !state.menuItems || !state.ownerInvitations || !state.reservations) {
        throw new Error("Required DineSight schema is not installed");
      }
      return { status: "ready" };
    } catch {
      // Never expose the connection string, schema metadata or SQL errors.
      throw new ServiceUnavailableException("DineSight database migration is not ready");
    }
  }
}
