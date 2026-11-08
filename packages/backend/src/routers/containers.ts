import { protectedProcedure as procedure, t } from "../trpc.js"
import { createDockerContainer, dockerRequest, pullDockerImage, type DockerContainerSummary, type DockerImageSummary } from "../docker-api.js"
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
    create: procedure
        .input(z.object({
            name: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/),
            image: z.string().trim().min(1),
            command: z.array(z.string()),
            ports: z.array(z.object({ host: z.string().regex(/^\d{1,5}$/), container: z.string().regex(/^\d{1,5}$/), protocol: z.enum(["tcp", "udp"]), hostIp: z.string().optional() })),
            mounts: z.array(z.string().min(1)),
            env: z.array(z.string().regex(/^[^=\u0000]+=.*/)),
        }))
        .mutation(async ({ input }) => {
            for (const port of input.ports) {
                if (Number(port.host) > 65535 || Number(port.host) < 1 || Number(port.container) > 65535 || Number(port.container) < 1) {
                    throw new Error("Ports must be between 1 and 65535")
                }
            }
            const exposedPorts: Record<string, Record<string, never>> = {}
            const portBindings: Record<string, Array<{ HostPort: string; HostIp?: string }>> = {}
            for (const port of input.ports) {
                const key = `${port.container}/${port.protocol}`
                exposedPorts[key] = {}
                portBindings[key] = [{ HostPort: port.host, ...(port.hostIp ? { HostIp: port.hostIp } : {}) }]
            }
            const { Id } = await createDockerContainer(input.name, {
                Image: input.image,
                ...(input.command.length ? { Cmd: input.command } : {}),
                ...(input.env.length ? { Env: input.env } : {}),
                ...(input.ports.length ? { ExposedPorts: exposedPorts, HostConfig: { PortBindings: portBindings, ...(input.mounts.length ? { Binds: input.mounts } : {}) } } : {}),
                ...(!input.ports.length && input.mounts.length ? { HostConfig: { Binds: input.mounts } } : {}),
            })
            await dockerRequest("POST", `/containers/${encodeURIComponent(Id)}/start`)
            return { Id }
        }),
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
