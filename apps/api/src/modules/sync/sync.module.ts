import { Module } from "@nestjs/common";
import { SyncScheduler } from "./sync.scheduler";

@Module({
  providers: [SyncScheduler],
})
export class SyncModule {}
