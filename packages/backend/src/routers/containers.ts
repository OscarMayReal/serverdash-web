import { protectedProcedure as procedure, t } from "../trpc.js"
import os from "os"
import sysinfo from "systeminformation"

import Dockerode from "dockerode"
import z from "zod"

const docker = new Dockerode()

type ImagePullProgress = {
    status: "pulling" | "complete" | "error"
    message: string
    current?: number
    total?: number
}

const imagePullJobs = new Map<string, ImagePullProgress>()

async function pullImage(jobId: string, name: string) {
    try {
        const stream = await docker.pull(name)
        let streamError: string | undefined

        await new Promise<void>((resolve, reject) => {
            docker.modem.followProgress(
                stream,
                (error: Error | null) => {
                    if (error) {
                        reject(error)
                        return
                    }

                    resolve()
                },
                (event: { status?: string; id?: string; progress?: string; error?: string; errorDetail?: { message?: string }; progressDetail?: { current?: number; total?: number } }) => {
                    if (event.error || event.errorDetail?.message) {
                        streamError = event.error ?? event.errorDetail?.message
                        return
                    }

                    const detail = event.progressDetail
                    imagePullJobs.set(jobId, {
                        status: "pulling",
                        message: [event.id, event.status, event.progress].filter(Boolean).join(": ") || "Downloading image",
                        ...(typeof detail?.current === "number" ? { current: detail.current } : {}),
                        ...(typeof detail?.total === "number" ? { total: detail.total } : {}),
                    })
                },
            )
        })

        if (streamError) throw new Error(streamError)
        imagePullJobs.set(jobId, { status: "complete", message: "Image download complete" })
    } catch (error) {
        imagePullJobs.set(jobId, {
            status: "error",
            message: error instanceof Error ? error.message : "Image download failed",
        })
    }
}

export const containerRouter = t.router({
    ps: procedure.query(async (opts) => {
        return await docker.listContainers({
            all: true
        })
    }),
    restart: procedure
        .input(z.object({id: z.string()}))
        .mutation(async (opts) => {
            return await docker.getContainer(opts.input.id).restart()
        }),
    stop: procedure
        .input(z.object({id: z.string()}))
        .mutation(async (opts) => {
            return await docker.getContainer(opts.input.id).stop()
        }),
    start: procedure
        .input(z.object({id: z.string()}))
        .mutation(async (opts) => {
            return await docker.getContainer(opts.input.id).start()
        }),
    rm: procedure
        .input(z.object({id: z.string()}))
        .mutation(async (opts) => {
            return await docker.getContainer(opts.input.id).remove()
        }),
    image: t.router({
        ls: procedure.query(async (opts) => {
            return await docker.listImages()
        }),
        pullProgress: procedure
            .input(z.object({ jobId: z.string() }))
            .query(({ input }) => imagePullJobs.get(input.jobId) ?? null),
        pull: procedure
            .input(z.object({name: z.string()}))
            .mutation(async (opts) => {
                const jobId = crypto.randomUUID()
                imagePullJobs.set(jobId, { status: "pulling", message: "Starting image download" })
                void pullImage(jobId, opts.input.name)
                return { jobId }
            })
    })
})
