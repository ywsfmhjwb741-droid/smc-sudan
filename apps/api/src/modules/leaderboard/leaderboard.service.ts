import { Injectable, Inject } from "@nestjs/common";
import { DATABASE_TOKEN } from "../../database/database.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema/index";
import { desc } from "drizzle-orm";

@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>
  ) {}

  async getLeaderboard() {
    return this.db.select().from(schema.playerStats)
      .orderBy(desc(schema.playerStats.leaderboardWeight))
      .limit(100);
  }

  async getSnapshot() { return []; }
}