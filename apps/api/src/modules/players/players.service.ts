import { Injectable } from "@nestjs/common";
import { InjectDatabase } from "../../database/database.module";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../database/schema/index";

@Injectable()
export class PlayersService {
  constructor(
    @InjectDatabase() private readonly db: NodePgDatabase<typeof schema>
  ) {}

  async registerPlayer(data: { mlbbId: string; serverId?: string; username: string }) {
    const [player] = await this.db
      .insert(schema.players)
      .values({
        mlbbId: data.mlbbId,
        serverId: data.serverId,
        username: data.username,
      })
      .returning();
    return player;
  }

  async getPlayers() {
    return this.db.select().from(schema.players).limit(50);
  }

  async getPlayer(id: string) {
    const players = await this.db
      .select()
      .from(schema.players)
      .where(schema.players.id === id as any);
    return players[0];
  }
}