import { filesRouter } from "./routers/files.js"
import { infoRouter } from "./routers/info.js"
import { authRouter } from "./routers/auth.js"
import { t } from "./trpc.js"

export const appRouter = t.router({
  greeting: t.procedure.query(() => ({
    message: "Hello from the backend package!",
  })),
  filesRouter,
  infoRouter,
  authRouter,
})

export type AppRouter = typeof appRouter
