import { cp, copyFile, lstat, mkdir, readlink, readdir, realpath, rename, rm } from "node:fs/promises"
import { join, relative } from "node:path"

const root = join(import.meta.dir, "..")
const release = join(root, "release")

type RuntimeLink = { path: string; target: string }
const runtimeLinks: RuntimeLink[] = []

async function copyRuntimeFiles(source: string, destination: string, relativePath = "") {
  const stats = await lstat(source)
  if (stats.isSymbolicLink()) {
    runtimeLinks.push({ path: relativePath, target: await readlink(source) })
    return
  }
  if (stats.isDirectory()) {
    await mkdir(destination, { recursive: true })
    for (const name of await readdir(source)) {
      const childRelative = relativePath ? `${relativePath}/${name}` : name
      await copyRuntimeFiles(join(source, name), join(destination, name), childRelative)
    }
    return
  }
  await mkdir(join(destination, ".."), { recursive: true })
  await copyFile(source, destination)
}

async function run(args: string[]) {
  const env = { ...process.env }
  for (const key of ["AUTH_SECRET", "PAM_SERVICE", "BACKEND_URL", "NEXT_PUBLIC_SERVER_URL", "PORT", "BACKEND_PORT", "SERVERDASH_DATA_DIR"]) {
    delete env[key]
  }
  const proc = Bun.spawn(args, { cwd: root, env, stdin: "inherit", stdout: "inherit", stderr: "inherit" })
  const code = await proc.exited
  if (code !== 0) throw new Error(`Command failed (${code}): ${args.join(" ")}`)
}

await rm(release, { recursive: true, force: true })
const envFiles = (await readdir(join(root, "apps/web")))
  .filter((name) => name.startsWith(".env"))
  .map((name) => ({ original: join(root, "apps/web", name), hidden: join(root, "apps/web", `${name}.serverdash-build-hidden`) }))
try {
  for (const file of envFiles) await rename(file.original, file.hidden)
  await run(["bun", "run", "build"])
} finally {
  for (const file of envFiles) {
    try { await rename(file.hidden, file.original) } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }
}
await mkdir(release, { recursive: true })
const bundleAssets = join(release, ".assets")
const standaloneRoot = join(root, "apps/web/.next/standalone")
await mkdir(bundleAssets, { recursive: true })
// Preserve the standalone package store paths and ship a manifest for Bun to
// recreate its symlinks after extracting the embedded regular files.
await copyRuntimeFiles(standaloneRoot, join(bundleAssets, "standalone"))
// Next's file tracer omits this addon, which is loaded dynamically by `bindings`.
const pamPackageInStandalone = await realpath(join(standaloneRoot, "node_modules/node-linux-pam"))
const pamPackageInWorkspace = await realpath(join(root, "apps/web/node_modules/node-linux-pam"))
const pamPackageRelative = relative(standaloneRoot, pamPackageInStandalone)
const pamAddonRelative = join(pamPackageRelative, "build/Release/node-linux-pam.node")
await mkdir(join(bundleAssets, "standalone", pamPackageRelative, "build/Release"), { recursive: true })
await copyFile(join(pamPackageInWorkspace, "build/Release/node-linux-pam.node"), join(bundleAssets, "standalone", pamAddonRelative))
await mkdir(join(bundleAssets, "metadata"), { recursive: true })
await Bun.write(join(bundleAssets, "metadata/symlinks.json"), JSON.stringify(runtimeLinks))
await cp(join(root, "apps/web/.next/static"), join(bundleAssets, "static"), { recursive: true, dereference: true })
await run([
  "bun", "build", "--compile", "--compile-autoload-package-json", "--no-compile-autoload-dotenv", "scripts/launcher.ts", "--target", "bun-linux-x64",
  "--asset", join(bundleAssets, "standalone"),
  "--asset", join(bundleAssets, "static"),
  "--asset", join(bundleAssets, "metadata"),
  "--outfile", join(release, "serverdash"),
])
await rm(bundleAssets, { recursive: true, force: true })

console.info(`Created the single-file Linux x64 executable: ${join(release, "serverdash")}`)
