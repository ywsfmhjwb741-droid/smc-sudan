// ============================================================
// tRPC Router - Type-safe API layer
// ============================================================

import { Injectable } from "@nestjs/common";
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { PlayersService } from "../modules/players/players.service";
import { LeaderboardService } from "../modules/leaderboard/leaderboard.service";

const t = initTRPC.create();

const publicProcedure = t.procedure;

// ─── Input Schemas ────────────────────────────────────────────

const RegisterPlayerSchema = z.object({
  mlbbId: z.string().min(4).max(20).regex(/^\d+$/, "MLBB ID must be numeric"),
  serverId: z.string().optional(),
});

const LeaderboardFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  region: z.string().optional(),
  heroId: z.string().optional(),
  season: z.string().optional(),
});

const PlayerIdSchema = z.object({
  playerId: z.string().uuid(),
});

// ─── Router ───────────────────────────────────────────────────

@Injectable()
export class TrpcRouter {
  constructor(
    private readonly playersService: PlayersService,
    private readonly leaderboardService: LeaderboardService
  ) {}

  get appRouter() {
    const playersService = this.playersService;
    const leaderboardService = this.leaderboardService;

    return t.router({
      // ─── Players ───────────────────────────────────────────

      players: t.router({
        register: publicProcedure
          .input(RegisterPlayerSchema)
          .mutation(async ({ input }) => {
            try {
              const player = await playersService.registerPlayer(input);
              return { success: true, player };
            } catch (err) {
              if (err instanceof Error) {
                throw new TRPCError({
                  code: err.message.includes("already registered")
                    ? "CONFLICT"
                    : err.message.includes("not found")
                    ? "NOT_FOUND"
                    : "INTERNAL_SERVER_ERROR",
                  message: err.message,
                });
              }
              throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
            }
          }),

        getProfile: publicProcedure
          .input(PlayerIdSchema)
          .query(async ({ input }) => {
            try {
              return await playersService.getPlayerProfile(input.playerId);
            } catch (err) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: `Player ${input.playerId} not found`,
              });
            }
          }),

        search: publicProcedure
          .input(z.object({ query: z.string().min(2), limit: z.number().default(10) }))
          .query(async ({ input }) => {
            return playersService.searchPlayers(input.query, input.limit);
          }),
      }),

      // ─── Leaderboard ───────────────────────────────────────

      leaderboard: t.router({
        get: publicProcedure
          .input(LeaderboardFilterSchema)
          .query(async ({ input }) => {
            return leaderboardService.getLeaderboard(input);
          }),

        getPlayerRank: publicProcedure
          .input(PlayerIdSchema)
          .query(async ({ input }) => {
            const rank = await leaderboardService.getPlayerRank(input.playerId);
            return { rank };
          }),
      }),
    });
  }
}

export type AppRouter = any;
