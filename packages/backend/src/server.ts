import { createHTTPServer } from "@trpc/server/adapters/standalone"

import { appRouter } from "./router.js"
import { sessionCookieName, verifySessionToken } from "./auth.js"

const port = Number(process.env.PORT ?? 3001)

const server = createHTTPServer({
  basePath: "/api/trpc",
  router: appRouter,
  createContext: ({ req }) => {
    const cookieHeader = req.headers.cookie ?? ""
    const token = cookieHeader.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1)
    return { session: verifySessionToken(token ? decodeURIComponent(token) : undefined) }
  },
})

server.listen(port)

console.info(`tRPC backend listening on http://localhost:${port}/api/trpc`)
