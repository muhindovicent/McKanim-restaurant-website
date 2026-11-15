import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnvironment } from "./config/env.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { PublicMenuModule } from "./menu/public-menu.module.js";
import { HealthController } from "./health/health.controller.js";
import { OnboardingModule } from "./onboarding/onboarding.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    PublicMenuModule,
    OnboardingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
