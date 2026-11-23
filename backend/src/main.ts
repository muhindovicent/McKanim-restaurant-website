import "reflect-metadata";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: false });
  const config = app.get(ConfigService);
  const origins = config.getOrThrow<string>("CORS_ORIGINS").split(",").map(s => s.trim());
  app.use(helmet());
  app.enableCors({ origin: origins, credentials: false, methods: ["GET", "POST", "PATCH", "OPTIONS"] });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({
    transform: true, whitelist: true, forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  }));
  await app.listen(config.getOrThrow<number>("PORT"), "0.0.0.0");
}

void bootstrap().catch(error => {
  // Avoid logging database connection strings, environment variables or secrets.
  console.error("DineSight API startup failed:", error?.name || "Error");
  process.exitCode = 1;
});
