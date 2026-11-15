import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export type ProvisionBranchInput = {
  organizationId: string;
  slug: string;
  name: string;
};

@Injectable()
export class BranchProvisioningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Internal-only method: no HTTP controller is exposed for provisioning.
   * The future platform administration endpoint MUST authenticate and authorize
   * a platform operator before invoking this service.
   */
  async provision(input: ProvisionBranchInput) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.organizationId)) {
      throw new BadRequestException("Invalid organization identifier");
    }
    const slug = input.slug?.trim().toLowerCase();
    const name = input.name?.trim();
    if (!slug || !/^[a-z0-9-]{2,80}$/.test(slug) || !name || name.length > 160) {
      throw new BadRequestException("Invalid restaurant slug or name");
    }

    return this.prisma.$transaction(async (tx) => {
      // PostgreSQL row lock serializes concurrent onboarding requests for the SAME organization.
      // Without it, two callers could both observe a count below the branchLimit.
      const organizations = await tx.$queryRaw<Array<{ id: string; branchLimit: number }>>`
        SELECT id, "branchLimit" FROM organizations
        WHERE id = ${input.organizationId}::uuid FOR UPDATE
      `;
      const organization = organizations[0];
      if (!organization) throw new NotFoundException("Organization not found");

      const existingBranches = await tx.restaurant.count({
        where: { organizationId: organization.id },
      });
      if (existingBranches >= organization.branchLimit) {
        throw new ConflictException("Organization branch limit reached");
      }

      const restaurant = await tx.restaurant.create({
        data: {
          organizationId: organization.id,
          slug,
          name,
          currency: "UGX",
          published: false,
        },
        select: { id: true, organizationId: true, slug: true, name: true, published: true },
      });
      return restaurant;
    }, { isolationLevel: "ReadCommitted" });
  }
}
