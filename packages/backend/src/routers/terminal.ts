import { execFile } from "node:child_process"
import { randomUUID } from "node:crypto"
import { promisify } from "node:util"
import z from "zod"

import { protectedProcedure, t } from "../trpc.js"

const execFileAsync = promisify(execFile)
const MAX_BUFFER_SIZE = 256 * 1024
const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000

type TerminalSession = {
  username: string
  process: Bun.Subprocess
  terminal: Bun.Terminal
  output: { value: string }
  lastActivity: number
  closed: boolean
}

const sessions = new Map<string, TerminalSession>()

const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - SESSION_IDLE_TIMEOUT_MS
  for (const [id, session] of sessions) {
    if (session.lastActivity < cutoff) {
      sessions.delete(id)
      if (!session.closed) {
        session.process.kill()
        session.terminal.close()
      }
    }
  }
}, 60_000)
cleanupTimer.unref()

function getOwnedSession(id: string, username: string) {
  const session = sessions.get(id)
  if (!session || session.username !== username) return null
  if (Date.now() - session.lastActivity > SESSION_IDLE_TIMEOUT_MS) {
    if (!session.closed) {
      session.process.kill()
      session.terminal.close()
    }
    sessions.delete(id)
    return null
  }
  session.lastActivity = Date.now()
  return session
}

export const terminalRouter = t.router({
  start: protectedProcedure.mutation(async ({ ctx }) => {
    const username = ctx.session.username
    const { stdout } = await execFileAsync("getent", ["passwd", username], { timeout: 3000, maxBuffer: 4096 })
    const account = stdout.trim().split("\n").map((line) => line.split(":"))
      .find((fields) => fields[0] === username && fields.length >= 7)
    if (!account) throw new Error("Could not find the signed-in system account")

    const uid = Number(account[2])
    const gid = Number(account[3])
    const home = account[5] ?? ""
    const shell = account[6] || "/bin/sh"
    if (!Number.isInteger(uid) || !Number.isInteger(gid) || !home.startsWith("/")) {
      throw new Error("Invalid system account configuration")
    }
    if (process.getuid?.() !== 0 && uid !== process.getuid?.()) {
      throw new Error("The terminal service must run as root to open sessions for other users")
    }

    const output = { value: "" }
    const decoder = new TextDecoder()
    const terminal = new Bun.Terminal({
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      data: (_terminal, data) => {
        output.value = (output.value + decoder.decode(data, { stream: true })).slice(-MAX_BUFFER_SIZE)
      },
    })
    const id = randomUUID()
    const subprocess = Bun.spawn([shell, "-l"], {
      cwd: home,
      env: {
        PATH: process.env.PATH ?? "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        LANG: process.env.LANG ?? "C.UTF-8",
        HOME: home,
        USER: username,
        LOGNAME: username,
        SHELL: shell,
        TERM: "xterm-256color",
      },
      ...(process.getuid?.() === 0 ? { uid, gid } : {}),
      detached: true,
      terminal,
    })
    const session: TerminalSession = { username, process: subprocess, terminal, output, lastActivity: Date.now(), closed: false }
    sessions.set(id, session)
    void subprocess.exited.then(() => {
      session.closed = true
      if (!terminal.closed) terminal.close()
    })
    return { id }
  }),

  input: protectedProcedure.input(z.object({ id: z.string().uuid(), data: z.string().max(16_384) })).mutation(({ ctx, input }) => {
    const session = getOwnedSession(input.id, ctx.session.username)
    if (!session || session.closed) return { closed: true }
    session.terminal.write(input.data)
    return { closed: false }
  }),

  resize: protectedProcedure.input(z.object({ id: z.string().uuid(), cols: z.number().int().min(2).max(500), rows: z.number().int().min(2).max(200) })).mutation(({ ctx, input }) => {
    const session = getOwnedSession(input.id, ctx.session.username)
    if (!session || session.closed) return { closed: true }
    session.terminal.resize(input.cols, input.rows)
    return { closed: false }
  }),

  read: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => {
    const session = getOwnedSession(input.id, ctx.session.username)
    if (!session) return { data: "", closed: true }
    const data = session.output.value
    session.output.value = ""
    return { data, closed: session.closed }
  }),

  close: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(({ ctx, input }) => {
    const session = getOwnedSession(input.id, ctx.session.username)
    if (!session) return { closed: true }
    sessions.delete(input.id)
    if (!session.closed) session.process.kill()
    if (!session.terminal.closed) session.terminal.close()
    return { closed: true }
  }),
})
