import { Injectable } from "@nestjs/common";
import { initTRPC } from "@trpc/server";
import { PlayersService } from "../modules/players/players.service";
import { LeaderboardService } from "../modules/leaderboard/leaderboard.service";
import { z } from "zod";

const t = initTRPC.create();

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly players: PlayersService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  appRouter() {
    return t.router({
      players: t.router({
        register: t.procedure
          .input(z.object({ mlbbId: z.string(), username: z.string() }))
          .mutation(async ({ input }) => this.players.registerPlayer(input)),
        list: t.procedure.query(async () => this.players.getPlayers()),
      }),
      leaderboard: t.router({
        get: t.procedure.query(async () => this.leaderboard.getLeaderboard()),
      }),
    });
  }
}

export type AppRouter = ReturnType<TrpcRouter["appRouter"]>;