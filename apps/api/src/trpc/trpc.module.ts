import { Module } from "@nestjs/common";
import { TrpcRouter } from "./trpc.router";
import { TrpcController } from "./trpc.controller";

@Module({
  controllers: [TrpcController],
  providers: [TrpcRouter],
})
export class TrpcModule {}
