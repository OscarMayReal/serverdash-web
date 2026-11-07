import { initTRPC } from "@trpc/server"
import z from "zod"
import fs from "node:fs/promises"
import { Stats } from "node:fs"
import path from "node:path"

const t = initTRPC.create()

export const filesRouter = t.router({
    ls: t.procedure
        .input(z.object({path: z.string().optional()}))
        .query(async (opts) => {
            const requestedPath = opts.input.path || "."
            const dir = await fs.readdir(requestedPath)
            const newFiles: {file: string, stats: Stats, isFolder: boolean}[] = []
            for (var file of dir) {
                const stats = await fs.stat(path.join(requestedPath, file))
                const isFolder = stats.isDirectory()
                newFiles.push({file, stats, isFolder})
            }
            return newFiles
        }),
    rm: t.procedure
        .input(z.object({path: z.string()}))
        .mutation(async (opts) => {
            try {
                await fs.rm(opts.input.path)
                return {success: true}
            } catch {
                return {success: false}
            }
        }),
    copy: t.procedure
        .input(z.object({sourcePath: z.string(), destinationPath: z.string()}))
        .mutation(async (opts) => {
            const source = path.resolve(opts.input.sourcePath)
            const destination = path.join(path.resolve(opts.input.destinationPath), path.basename(source))
            if (source === destination) {
                throw new Error("The item is already in this directory")
            }
            await fs.cp(source, destination, {recursive: true, force: false, errorOnExist: true})
            return {success: true}
        }),
    download: t.procedure
        .input(z.object({path: z.string()}))
        .query(async (opts) => {
            const file = await fs.readFile(opts.input.path)
            return {
                fileName: path.basename(opts.input.path),
                data: file.toString("base64"),
            }
        }),
    upload: t.procedure
        .input(z.object({path: z.string(), fileName: z.string().min(1), data: z.string()}))
        .mutation(async (opts) => {
            const safeFileName = path.basename(opts.input.fileName)
            if (!safeFileName || safeFileName === "." || safeFileName === "..") {
                throw new Error("Invalid file name")
            }
            const destination = path.join(opts.input.path, safeFileName)
            await fs.writeFile(destination, Buffer.from(opts.input.data, "base64"))
            return {success: true, fileName: safeFileName}
        })
})
