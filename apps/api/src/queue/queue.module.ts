 import { Module, Global } from "@nestjs/common";
import { SyncProcessor } from "./sync.processor";
@Global()
@Module({
  providers: [SyncProcessor],
  exports: [SyncProcessor],
})
export class QueueModule {}
