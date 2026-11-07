import { initTRPC } from "@trpc/server"
import { filesRouter } from "./routers/files.js"
import { infoRouter } from "./routers/info.js"

const t = initTRPC.create()

export const appRouter = t.router({
  greeting: t.procedure.query(() => ({
    message: "Hello from the backend package!",
  })),
  filesRouter,
  infoRouter
})

export type AppRouter = typeof appRouter
