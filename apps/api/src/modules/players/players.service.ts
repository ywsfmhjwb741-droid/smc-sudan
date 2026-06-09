import { Injectable, Inject } from "@nestjs/common";
import { DATABASE_TOKEN } from "../../database/database.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema/index";
import { eq } from "drizzle-orm";

@Injectable()
export class PlayersService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>
  ) {}
async registerPlayer(data: { mlbbId?: string; serverId?: string; username?: string }) {
    const [player] = await this.db
      .insert(schema.players)
      .values({
        mlbbId: data.mlbbId,
        username: data.username,
      })
      .returning();
    return player;
  }

  async getPlayers() {
    return this.db.select().from(schema.players).limit(50);
  }

  async getPlayer(id: string) {
    const result = await this.db
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, id));
    return result[0];
  }
}