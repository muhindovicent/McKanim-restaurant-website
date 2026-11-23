import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { ensureMcKanimPilot } from "../src/onboarding/mckanim-bootstrap.js";

const isProduction = process.env.NODE_ENV === "production";
if (isProduction || process.env.CONFIRM_MCKANIM_PREVIEW_BOOTSTRAP !== "yes") {
  throw new Error(
    "McKanim bootstrap is for explicitly approved non-production environments only. " +
    "Set CONFIRM_MCKANIM_PREVIEW_BOOTSTRAP=yes in development/test."
  );
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const { organization, restaurant } = await ensureMcKanimPilot(db);
  // Only brand and safe status details: never print private connection details.
  console.log(JSON.stringify({
    organization: organization.slug,
    restaurant: restaurant.name,
    currency: restaurant.currency,
    branchLimit: organization.branchLimit,
    organizationActive: organization.active,
    restaurantPublished: restaurant.published,
  }));
} finally {
  await db.$disconnect();
}
