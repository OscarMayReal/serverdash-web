import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { protectedProcedure, t } from "../trpc.js"

const execFileAsync = promisify(execFile)

export const authRouter = t.router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const username = ctx.session.username
    const { stdout } = await execFileAsync("getent", ["passwd", username], { timeout: 3000, maxBuffer: 4096 })
    const account = stdout.trim().split("\n").find((line) => line.split(":", 1)[0] === username)
    const homeDirectory = account?.split(":")[5]
    if (!homeDirectory) throw new Error("Could not find a home directory for this account")
    return { username, homeDirectory }
  }),
})
