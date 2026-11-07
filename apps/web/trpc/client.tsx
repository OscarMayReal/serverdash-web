"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { useState } from "react"

import type { AppRouter } from "@workspace/backend/router"

export const trpc: ReturnType<typeof createTRPCReact<AppRouter>> = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  return process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000"
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }))
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        maxItems: 1,
        fetch: (url, options) => fetch(url, { ...options, credentials: "include", signal: AbortSignal.timeout(15000) }),
      })],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
