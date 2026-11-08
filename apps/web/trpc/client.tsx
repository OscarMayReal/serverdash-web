"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { useState } from "react"

import type { AppRouter } from "@workspace/backend/router"

export const trpc: ReturnType<typeof createTRPCReact<AppRouter>> = createTRPCReact<AppRouter>()
let logoutRedirectStarted = false

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  return "http://localhost:3000"
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }))
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        maxItems: 1,
        fetch: async (url, options) => {
          const response = await fetch(url, { ...options, credentials: "include", signal: AbortSignal.timeout(15000) })
          if (response.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login" && !logoutRedirectStarted) {
            logoutRedirectStarted = true
            void fetch("/api/auth/logout", { method: "POST", credentials: "include" })
              .finally(() => window.location.replace("/login"))
          }
          return response
        },
      })],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
