import { Module } from "@nestjs/common";
import { BranchProvisioningService } from "./branch-provisioning.service.js";

@Module({
  providers: [BranchProvisioningService],
  exports: [BranchProvisioningService],
})
export class OnboardingModule {}
