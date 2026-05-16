// ============================================================
// SMC Sudan MOBA Community - NestJS App Module
// ============================================================

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { TerminusModule } from "@nestjs/terminus";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import { DatabaseModule } from "./database/database.module";
import { CacheModule } from "./cache/cache.module";
import { QueueModule } from "./queue/queue.module";
import { DataLayerModule } from "./data-layer/data-layer.module";
import { PlayersModule } from "./modules/players/players.module";
import { LeaderboardModule } from "./modules/leaderboard/leaderboard.module";
import { SyncModule } from "./modules/sync/sync.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { TrpcModule } from "./trpc/trpc.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Structured logging
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${String(timestamp)} [${String(context ?? "App")}] ${level}: ${String(message)}`;
            })
          ),
        }),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Health checks
    TerminusModule,

    // Core modules
    DatabaseModule,
    CacheModule,
    QueueModule,
    DataLayerModule,

    // Feature modules
    PlayersModule,
    LeaderboardModule,
    SyncModule,
    AdminModule,
    HealthModule,

    // tRPC
    TrpcModule,
  ],
})
export class AppModule {}
