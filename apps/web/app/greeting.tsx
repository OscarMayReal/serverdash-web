"use client"

import { trpc } from "@/trpc/client"

export function Greeting() {
  const greeting = trpc.greeting.useQuery()

  if (greeting.isPending) return <p>Loading backend greeting…</p>
  if (greeting.error) return <p>Could not load the backend greeting.</p>

  return <p>{greeting.data.message}</p>
}
