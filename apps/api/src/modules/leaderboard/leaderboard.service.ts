import { Injectable } from "@nestjs/common";
import { InjectDatabase } from "../../database/database.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema/index";
import { desc } from "drizzle-orm";

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectDatabase() private readonly db: NodePgDatabase<typeof schema>
  ) {}

  async getLeaderboard() {
    return this.db
      .select()
      .from(schema.playerStats)
      .orderBy(desc(schema.playerStats.leaderboardWeight))
      .limit(100);
  }
}