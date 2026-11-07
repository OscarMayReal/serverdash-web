import { protectedProcedure as procedure, t } from "../trpc.js"
import os from "os"
import sysinfo from "systeminformation"

export const infoRouter = t.router({
    hostname: procedure.query((opts) => {
        return os.hostname()
    }),
    osInfo: procedure.query(async (opts) => {
        const uptime = os.uptime()
        const osRelease = os.release()
        const osPlatform = os.platform()
        const osNetworkInterfaces = os.networkInterfaces()
        const sysinfoCpuTemperature = await sysinfo.cpuTemperature()
        const sysinfoMem = await sysinfo.mem()
        return {uptime, osRelease, osPlatform, osNetworkInterfaces, sysinfoCpuTemperature, sysinfoMem}
    })
})
