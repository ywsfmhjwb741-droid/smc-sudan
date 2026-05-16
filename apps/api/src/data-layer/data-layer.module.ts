import { Module, Global } from "@nestjs/common";
import { MlbbApiAdapter } from "./adapters/mlbb-api.adapter";
import { MlbbScraperAdapter } from "./adapters/mlbb-scraper.adapter";
import { UnifiedFetcher } from "./fetcher/unified-fetcher";

@Global()
@Module({
  providers: [MlbbApiAdapter, MlbbScraperAdapter, UnifiedFetcher],
  exports: [UnifiedFetcher],
})
export class DataLayerModule {}
