"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

// @ts-nocheck
export const trpc = createTRPCReact();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env["VERCEL_URL"]) return `https://${process.env["VERCEL_URL"]}`;
  return `http://localhost:${process.env["PORT"] ?? 3001}`;
}

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    (trpc as any).createClient({
      links: [httpBatchLink({ url: `${getBaseUrl()}/api/trpc` })],
    })
  );
  return (
    <(trpc as any).Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </(trpc as any).Provider>
  );
}