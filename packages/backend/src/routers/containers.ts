import { protectedProcedure as procedure, t } from "../trpc.js"
import { dockerRequest, pullDockerImage, type DockerContainerSummary, type DockerImageSummary } from "../docker-api.js"
import z from "zod"

type ImagePullProgress = {
    status: "pulling" | "complete" | "error"
    message: string
    current?: number
    total?: number
}

const imagePullJobs = new Map<string, ImagePullProgress>()

async function pullImage(jobId: string, name: string) {
    try {
        await pullDockerImage(name, (event) => {
            const detail = event.progressDetail as { current?: number; total?: number } | undefined
            imagePullJobs.set(jobId, {
                status: "pulling",
                message: [event.id, event.status, event.progress].filter(Boolean).join(": ") || "Downloading image",
                ...(typeof detail?.current === "number" ? { current: detail.current } : {}),
                ...(typeof detail?.total === "number" ? { total: detail.total } : {}),
            })
        })
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
        return await dockerRequest<DockerContainerSummary[]>("GET", "/containers/json?all=1")
    }),
    restart: procedure
        .input(z.object({id: z.string()}))
        .mutation(async (opts) => {
            return await dockerRequest("POST", `/containers/${encodeURIComponent(opts.input.id)}/restart`)
        }),
    stop: procedure
        .input(z.object({id: z.string()}))
        .mutation(async (opts) => {
            return await dockerRequest("POST", `/containers/${encodeURIComponent(opts.input.id)}/stop`)
        }),
    start: procedure
        .input(z.object({id: z.string()}))
        .mutation(async (opts) => {
            return await dockerRequest("POST", `/containers/${encodeURIComponent(opts.input.id)}/start`)
        }),
    rm: procedure
        .input(z.object({id: z.string()}))
        .mutation(async (opts) => {
            return await dockerRequest("DELETE", `/containers/${encodeURIComponent(opts.input.id)}?force=0&v=0`)
        }),
    image: t.router({
        ls: procedure.query(async (opts) => {
            return await dockerRequest<DockerImageSummary[]>("GET", "/images/json")
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
