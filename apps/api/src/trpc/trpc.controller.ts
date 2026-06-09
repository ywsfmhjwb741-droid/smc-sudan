import { All, Controller, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TrpcRouter } from "./trpc.router";

@Controller("trpc")
export class TrpcController {
  constructor(private readonly trpcRouter: TrpcRouter) {}

  @All("*")
  async handle(@Req() req: Request, @Res() res: Response) {
    const router = this.trpcRouter.appRouter();
    const response = await fetchRequestHandler({
      endpoint: "/api/v1/trpc",
      req: req as unknown as globalThis.Request,
      router: router as any,
      createContext: () => ({}),
    });
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const body = await response.text();
    res.send(body);
  }
}