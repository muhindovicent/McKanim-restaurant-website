import { Module } from "@nestjs/common";
import { BranchProvisioningService } from "./branch-provisioning.service.js";
import { OwnerInvitationService } from "./owner-invitation.service.js";

@Module({
  providers: [BranchProvisioningService, OwnerInvitationService],
  exports: [BranchProvisioningService, OwnerInvitationService],
})
export class OnboardingModule {}
