import { Module, Global } from "@nestjs/common";
import { SyncQueueService, SyncWorkerService } from "./sync.processor";

@Global()
@Module({
  providers: [SyncQueueService, SyncWorkerService],
  exports: [SyncQueueService],
})
export class QueueModule {}
