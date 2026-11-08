import { protectedProcedure as procedure, t } from "../trpc.js"
import os from "os"
import sysinfo from "systeminformation"

import Dockerode from "dockerode"
import z from "zod"

const docker = new Dockerode()

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
        })
})
