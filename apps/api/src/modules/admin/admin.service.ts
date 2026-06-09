import { Injectable, Inject } from "@nestjs/common";
import { DATABASE_TOKEN } from "../../database/database.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema/index";
import { eq } from "drizzle-orm";

@Injectable()
export class AdminService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>
  ) {}

  async getDashboardStats() {
    const players = await this.db.select().from(schema.players);
    return { totalPlayers: players.length };
  }

  async banPlayer(id: string, reason: string) {
    return this.db.update(schema.players)
.set({ updatedAt: new Date() })
      .where(eq(schema.players.id, id));
  }

  async unbanPlayer(id: string) {
    return this.db.update(schema.players)
      .set({ updatedAt: new Date() })
      .where(eq(schema.players.id, id));
  }

  async forceSyncPlayer(id: string) { return { id }; }
  async getFailedSyncJobs() { return []; }
  async retryFailedJob(id: string) { return { id }; }
  async pauseSyncQueue() { return true; }
  async resumeSyncQueue() { return true; }
}