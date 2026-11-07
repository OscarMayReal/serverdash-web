"use client"
import { trpc } from "@/trpc/client"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@workspace/ui/components/item"
import { ClockIcon, CpuIcon, MemoryStick, NetworkIcon } from "lucide-react"
import { useEffect } from "react";

function formatSeconds(totalSeconds: number | undefined) {
  if (totalSeconds === undefined || !Number.isFinite(totalSeconds)) return "Loading…";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Pads single digits with a leading zero
  return [hours, minutes, seconds]
    .map(val => String(val).padStart(2, '0'))
    .join(':');
}

export function convertBytes(
  bytes: number | undefined,
  options: { useBinaryUnits?: boolean; decimals?: number } = {}
): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return "Loading…";
  const { useBinaryUnits = false, decimals = 2 } = options;

  if (decimals < 0) {
    throw new Error(`Invalid decimals ${decimals}`);
  }

  const base = useBinaryUnits ? 1024 : 1000;
  const units = useBinaryUnits
    ? ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
    : ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  if (bytes === 0) return `0 ${units[0]}`;

  const i = Math.floor(Math.log(bytes) / Math.log(base));

  return `${(bytes / Math.pow(base, i)).toFixed(decimals)} ${units[i]}`;
}


export default function ServerPage() {
    const hostname = trpc.infoRouter.hostname.useQuery()
    const osInfo = trpc.infoRouter.osInfo.useQuery()
    const user = trpc.authRouter.me.useQuery()
    useEffect(() => {
        const interval = setInterval(() => {
            osInfo.refetch()
        }, 1000)
        return () => {
            clearInterval(interval)
        }
    }, [])
    if (hostname.isPending) {
        return <div role="status" className="p-6">Loading server information…</div>
    }
    if (hostname.isError) {
        return <div role="alert" className="p-6 text-destructive">Unable to load server information: {hostname.error.message}</div>
    }
    return <div className="flex flex-col w-full h-full p-6">
        <h1 className="text-2xl flex flex-row items-center">
            {user.data?.username}@{hostname.data} <div className="text-sm ml-3">Running {osInfo.data?.osPlatform} {osInfo.data?.osRelease}</div>
        </h1>
        <div className="flex flex-row w-full pt-4 gap-4">
            <Item variant={"outline"}>
                <ItemMedia variant="icon">
                    <ClockIcon />
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>Uptime</ItemTitle>
                <ItemDescription>{osInfo.isError ? "Unavailable" : formatSeconds(osInfo.data?.uptime)}</ItemDescription>
                </ItemContent>
            </Item>
            <Item variant={"outline"}>
                <ItemMedia variant="icon">
                    <CpuIcon />
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>CPU Temprature</ItemTitle>
                <ItemDescription>{osInfo.isError ? "Unavailable" : osInfo.data?.sysinfoCpuTemperature.main ?? "Loading…"}°C</ItemDescription>
                </ItemContent>
            </Item>
            <Item variant={"outline"}>
                <ItemMedia variant="icon">
                    <MemoryStick />
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>Memory Usage</ItemTitle>
                    <ItemDescription>{osInfo.isError ? "Unavailable" : `${convertBytes(osInfo.data?.sysinfoMem?.used)}/${convertBytes(osInfo.data?.sysinfoMem?.total)}`}</ItemDescription>
                </ItemContent>
            </Item>
        </div>
    </div>
}
