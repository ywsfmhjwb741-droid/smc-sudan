// ============================================================
// SMC Sudan MOBA Community - API Entry Point
// ============================================================

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import * as compression from "compression";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug"],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 3001);
  const nodeEnv = config.get<string>("NODE_ENV", "development");

  // Security
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === "production",
    crossOriginEmbedderPolicy: false,
  }));

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: config.get<string>("FRONTEND_URL", "http://localhost:3000"),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global prefix
  app.setGlobalPrefix("api/v1");

  await app.listen(port);

  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   SMC Sudan MOBA Community API               ║
  ║   Environment: ${nodeEnv.padEnd(28)}║
  ║   Port: ${String(port).padEnd(35)}║
  ╚══════════════════════════════════════════════╝
  `);
}

void bootstrap();
