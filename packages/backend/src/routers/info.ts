import { initTRPC } from "@trpc/server"
import os from "os"
import sysinfo from "systeminformation"

const t = initTRPC.create()

export const infoRouter = t.router({
    hostname: t.procedure.query((opts) => {
        return os.hostname()
    }),
    osInfo: t.procedure.query(async (opts) => {
        const uptime = os.uptime()
        const osRelease = os.release()
        const osPlatform = os.platform()
        const osNetworkInterfaces = os.networkInterfaces()
        const sysinfoCpuTemperature = await sysinfo.cpuTemperature()
        const sysinfoMem = await sysinfo.mem()
        return {uptime, osRelease, osPlatform, osNetworkInterfaces, sysinfoCpuTemperature, sysinfoMem}
    })
})