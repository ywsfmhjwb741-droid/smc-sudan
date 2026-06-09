import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { QueueModule } from "./queue/queue.module";
import { PlayersModule } from "./modules/players/players.module";
import { LeaderboardModule } from "./modules/leaderboard/leaderboard.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { TrpcModule } from "./trpc/trpc.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    DatabaseModule,
    QueueModule,
    PlayersModule,
    LeaderboardModule,
    AdminModule,
    HealthModule,
    TrpcModule,
  ],
})
export class AppModule {}