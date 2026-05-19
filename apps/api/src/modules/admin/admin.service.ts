import { Injectable } from "@nestjs/common";
import { InjectDatabase } from "../../database/database.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema/index";

@Injectable()
export class AdminService {
  constructor(
    @InjectDatabase() private readonly db: NodePgDatabase<typeof schema>
  ) {}

  async getPlayers() {
    return this.db.select().from(schema.players);
  }

  async banPlayer(id: string, reason: string) {
    return this.db
      .update(schema.players)
      .set({ isBanned: true, banReason: reason, updatedAt: new Date() })
      .where(schema.players.id === id as any);
  }

  async unbanPlayer(id: string) {
    return this.db
      .update(schema.players)
      .set({ isBanned: false, banReason: null, updatedAt: new Date() });
  }
}