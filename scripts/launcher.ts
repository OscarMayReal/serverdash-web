import { randomBytes } from "node:crypto"
import { rmSync } from "node:fs"
import { chmod, mkdir, mkdtemp, open, readFile, symlink, writeFile } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

function openInTerminalWhenLaunchedFromDesktop() {
  if (process.stdin.isTTY || process.env.SERVERDASH_IN_TERMINAL === "1") return
  if (!process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) return

  const terminalCommands: Array<{ name: string; args: string[] }> = [
    { name: "x-terminal-emulator", args: ["-e"] },
    { name: "gnome-terminal", args: ["--"] },
    { name: "konsole", args: ["-e"] },
    { name: "xfce4-terminal", args: ["--execute"] },
    { name: "kitty", args: ["--"] },
    { name: "alacritty", args: ["-e"] },
    { name: "xterm", args: ["-e"] },
  ]

  for (const terminal of terminalCommands) {
    const executable = Bun.which(terminal.name)
    if (!executable) continue
    const child = Bun.spawn([executable, ...terminal.args, process.execPath], {
      env: { ...process.env, SERVERDASH_IN_TERMINAL: "1" },
      detached: true,
      stdin: "ignore",
      stdout: "ignore",
      stderr: "ignore",
    })
    child.unref()
    process.exit(0)
  }

  throw new Error("No supported terminal emulator was found. Run ServerDash from a terminal so you can stop it with Ctrl+C.")
}

openInTerminalWhenLaunchedFromDesktop()

async function getSecret() {
  const dataDir = process.env.SERVERDASH_DATA_DIR ?? join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"), "serverdash")
  await mkdir(dataDir, { recursive: true, mode: 0o700 })
  await chmod(dataDir, 0o700)
  const secretPath = join(dataDir, "auth-secret")

  try {
    const secret = (await readFile(secretPath, "utf8")).trim()
    await chmod(secretPath, 0o600)
    return secret
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }

  const secret = randomBytes(32).toString("hex")
  try {
    const file = await open(secretPath, "wx", 0o600)
    await file.writeFile(`${secret}\n`)
    await file.close()
    return secret
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
    return (await readFile(secretPath, "utf8")).trim()
  }
}

const secret = await getSecret()
if (secret.length < 32) throw new Error("Stored AUTH_SECRET is invalid; remove the auth-secret file to generate a new one")
process.env.AUTH_SECRET = secret
process.env.NODE_ENV = "production"
process.env.BACKEND_PORT ??= "3001"
process.env.PORT ??= "3000"
process.env.HOSTNAME ??= "0.0.0.0"
process.env.BACKEND_URL ??= `http://127.0.0.1:${process.env.BACKEND_PORT}`

const runtimeDir = await mkdtemp(join(tmpdir(), "serverdash-"))
process.on("exit", () => rmSync(runtimeDir, { recursive: true, force: true }))
await mkdir(runtimeDir, { recursive: true })
let runtimeLinks: Array<{ path: string; target: string }> = []
for (const asset of Bun.embeddedFiles) {
  const assetPath = asset.name.replaceAll("\\", "/")
  if (assetPath === "metadata/symlinks.json") {
    runtimeLinks = JSON.parse(await asset.text()) as Array<{ path: string; target: string }>
    continue
  }
  let destination: string
  if (assetPath.startsWith("standalone/")) {
    destination = join(runtimeDir, assetPath.slice("standalone/".length))
  } else if (assetPath.startsWith("static/")) {
    destination = join(runtimeDir, "apps/web/.next/static", assetPath.slice("static/".length))
  } else if (assetPath.startsWith("public/")) {
    destination = join(runtimeDir, "apps/web/public", assetPath.slice("public/".length))
  } else {
    continue
  }
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, await asset.arrayBuffer())
}
for (const link of runtimeLinks) {
  const linkPath = join(runtimeDir, link.path)
  await mkdir(dirname(linkPath), { recursive: true })
  await symlink(link.target, linkPath)
}

await import("../packages/backend/src/server.js")
const webRoot = resolve(runtimeDir, "apps/web")
process.chdir(webRoot)
await import(pathToFileURL(join(webRoot, "server.js")).href)

console.info(`ServerDash is listening on ${process.env.HOSTNAME}:${process.env.PORT}`)
