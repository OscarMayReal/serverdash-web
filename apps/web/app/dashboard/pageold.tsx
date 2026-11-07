import { ContainerIcon, FolderIcon, MonitorIcon, PlayIcon, ShieldIcon, TerminalIcon } from "lucide-react"

export default function DashboardHome() {
    return <div className="flex flex-col h-full w-full">
        <div className="p-4 pt-2 w-full bg-primary text-primary-foreground">
            <h1 className="text-3xl font-light">
                Hostname: Home
            </h1>
        </div>
            <div className="flex flex-col p-6 gap-4">
                <h2 className="text-2xl">Quick Access</h2>
                <div className="flex flex-row gap-2">
                    <AppItemTile className="bg-neutral-700 hover:bg-neutral-700/80" Icon={ShieldIcon} name="Admin" />
                    <AppItemTile className="bg-neutral-700 hover:bg-neutral-700/80" Icon={TerminalIcon} name="Terminal" />
                    <AppItemTile Icon={FolderIcon} name="Files" />
                    <AppItemTile Icon={PlayIcon} name="Media" />
                    <AppItemTile Icon={ContainerIcon} name="Containers" />
                    <AppItemTile Icon={MonitorIcon} name="Virtualisation" />
                </div>
            </div>
    </div>
}

function AppItemTile({className, Icon, name}: {className?: string, Icon: React.JSX.ElementType, name: string}) {
    return <div className="bg-black">
        <div className={`w-[125px] h-[125px] ${className || "bg-primary hover:bg-primary/80"} relative`}>
            <Icon size={35} className="text-white absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%]" strokeWidth="1.5" />
            <div className="text-white absolute bottom-1 left-2.5">{name}</div>
        </div>
    </div>
}
