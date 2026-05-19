import { Injectable } from "@nestjs/common";
import { TrpcService } from "./trpc.module";
import { PlayersService } from "../modules/players/players.service";
import { LeaderboardService } from "../modules/leaderboard/leaderboard.service";
import { z } from "zod";

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly players: PlayersService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  appRouter() {
    return this.trpc.router({
      players: this.trpc.router({
        register: this.trpc.procedure
          .input(z.object({ mlbbId: z.string(), serverId: z.string().optional(), username: z.string() }))
          .mutation(async ({ input }) => {
            return this.players.registerPlayer(input);
          }),
        list: this.trpc.procedure.query(async () => {
          return this.players.getPlayers();
        }),
      }),
      leaderboard: this.trpc.router({
        get: this.trpc.procedure.query(async () => {
          return this.leaderboard.getLeaderboard();
        }),
      }),
    });
  }
}

export type AppRouter = any;