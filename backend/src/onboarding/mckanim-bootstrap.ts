import type { PrismaClient } from "../generated/prisma/client.js";

/**
 * Verified owner-supplied pilot identity. This is NOT a published restaurant record.
 * Real address, owner email, opening hours, menu, and administrator credentials
 * must be supplied separately through an authenticated onboarding process.
 */
export const MCKANIM_PILOT = Object.freeze({
  organizationSlug: "mckanim",
  organizationName: "McKanim Restaurant",
  restaurantSlug: "mckanim",
  restaurantName: "McKanim Restaurant",
  currency: "UGX" as const,
  defaultBranchLimit: 1,
});

/**
 * Explicit development/staging bootstrap only. Safe to execute repeatedly.
 * Never seeds a password, administrator, public restaurant, or sample prices.
 * This function must NOT be wired to any unauthenticated HTTP route.
 */
export async function ensureMcKanimPilot(db: PrismaClient) {
  return db.$transaction(async tx => {
    const organization = await tx.organization.upsert({
      where: { slug: MCKANIM_PILOT.organizationSlug },
      create: {
        slug: MCKANIM_PILOT.organizationSlug,
        name: MCKANIM_PILOT.organizationName,
        active: false,
        branchLimit: MCKANIM_PILOT.defaultBranchLimit,
      },
      update: {},
      select: { id: true, slug: true, active: true, branchLimit: true },
    });

    // Serialize repeated/proximate runs for the same pilot without exposing an
    // administrator creation endpoint or allowing concurrent extra branches.
    await tx.$queryRaw`
      SELECT id FROM organizations WHERE id = ${organization.id}::uuid FOR UPDATE
    `;

    let restaurant = await tx.restaurant.findUnique({
      where: { slug: MCKANIM_PILOT.restaurantSlug },
      select: {
        id: true,
        organizationId: true,
        slug: true,
        name: true,
        currency: true,
        published: true,
      },
    });

    if (restaurant && restaurant.organizationId !== organization.id) {
      throw new Error("The McKanim restaurant slug is already owned by a different organization");
    }
    if (!restaurant) {
      const count = await tx.restaurant.count({
        where: { organizationId: organization.id },
      });
      if (count >= organization.branchLimit) {
        throw new Error("McKanim cannot be created: organization branch entitlement reached");
      }
      restaurant = await tx.restaurant.create({
        data: {
          organizationId: organization.id,
          slug: MCKANIM_PILOT.restaurantSlug,
          name: MCKANIM_PILOT.restaurantName,
          currency: MCKANIM_PILOT.currency,
          published: false,
        },
        select: {
          id: true,
          organizationId: true,
          slug: true,
          name: true,
          currency: true,
          published: true,
        },
      });
    }

    return {
      organization,
      restaurant,
    };
  });
}
