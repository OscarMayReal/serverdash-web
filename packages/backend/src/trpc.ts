import { initTRPC, TRPCError } from "@trpc/server"
import type { verifySessionToken } from "./auth.js"

type Session = NonNullable<ReturnType<typeof verifySessionToken>>
export const t = initTRPC.context<{ session: Session | null }>().create()
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" })
  return next({ ctx: { session: ctx.session } })
})
