import { Module } from "@nestjs/common";
import { TrpcRouter } from "./trpc.router";
import { TrpcController } from "./trpc.controller";
import { PlayersModule } from "../modules/players/players.module";
import { LeaderboardModule } from "../modules/leaderboard/leaderboard.module";

@Module({
  imports: [PlayersModule, LeaderboardModule],
  controllers: [TrpcController],
  providers: [TrpcRouter],
})
export class TrpcModule {}
