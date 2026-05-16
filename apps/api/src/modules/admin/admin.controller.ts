import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Post("players/:id/sync")
  @HttpCode(HttpStatus.OK)
  async forceSync(@Param("id") id: string) {
    await this.adminService.forceSyncPlayer(id);
    return { success: true, message: `Player ${id} sync triggered` };
  }

  @Post("players/:id/ban")
  @HttpCode(HttpStatus.OK)
  async banPlayer(
    @Param("id") id: string,
    @Body("reason") reason: string
  ) {
    await this.adminService.banPlayer(id, reason);
    return { success: true };
  }

  @Post("players/:id/unban")
  @HttpCode(HttpStatus.OK)
  async unbanPlayer(@Param("id") id: string) {
    await this.adminService.unbanPlayer(id);
    return { success: true };
  }

  @Get("queue/failed")
  async getFailedJobs() {
    const jobs = await this.adminService.getFailedSyncJobs();
    return { jobs: jobs.map((j) => ({ id: j.id, data: j.data, failedReason: j.failedReason })) };
  }

  @Post("queue/jobs/:id/retry")
  @HttpCode(HttpStatus.OK)
  async retryJob(@Param("id") id: string) {
    await this.adminService.retryFailedJob(id);
    return { success: true };
  }

  @Post("queue/pause")
  @HttpCode(HttpStatus.OK)
  async pauseQueue() {
    await this.adminService.pauseSyncQueue();
    return { success: true, message: "Queue paused" };
  }

  @Post("queue/resume")
  @HttpCode(HttpStatus.OK)
  async resumeQueue() {
    await this.adminService.resumeSyncQueue();
    return { success: true, message: "Queue resumed" };
  }
}
