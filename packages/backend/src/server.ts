import { createHTTPServer } from "@trpc/server/adapters/standalone"

import { appRouter } from "./router.js"

const port = Number(process.env.PORT ?? 3001)

const server = createHTTPServer({
  basePath: "/api/trpc",
  router: appRouter,
  createContext: () => ({}),
})

server.listen(port)

console.info(`tRPC backend listening on http://localhost:${port}/api/trpc`)
