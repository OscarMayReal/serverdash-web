import { Button } from "@workspace/ui/components/button"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar"
import { ContainerIcon, FolderIcon, HomeIcon, MonitorIcon, PlayIcon, SettingsIcon, TerminalIcon, UserIcon } from "lucide-react"
import React from "react"

// export default function DashboardLayout({children}: {children: React.JSX.Element}) {
//     return <div>
//         <Header />
//         {children}
//     </div>
// }
// 
// function Header() {
//     return <header className="w-full h-[40px] bg-primary text-primary-foreground flex flex-row items-center">
//         <h1 className="ml-3 text-lg hover:underline underline-offset-4 cursor-pointer">ServerDash</h1>
//         <div className="flex-1" />
//         <div className="flex flex-row items-center gap-4 mr-4">
//             <div className="font-medium">Home</div>
//             <div className="text-white/75">Admin</div>
//             <div className="text-white/75">Terminal</div>
//             <div className="text-white/75">Files</div>
//             <div className="text-white/75">Media</div>
//             <div className="text-white/75">Containers</div>
//             <div className="text-white/75">Virtualisation</div>
//         </div>
//         {/* <div className="h-[40px] flex flex-row px-4 bg-muted text-foreground items-center">
//             <p>Username</p>
//         </div> */}
//     </header>
// }

export default function DashboardLayout({children}: {children: React.JSX.Element}) {
    return <SidebarProvider>
        <Sidebar>
            <SidebarHeader className="p-0 h-[50px] items-center flex flex-row">
                <Button size="icon-sm" variant="ghost" className="ml-auto mr-0">
                    <UserIcon />
                </Button>
                <SidebarTrigger className="mr-3" />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenuButton><HomeIcon />Home</SidebarMenuButton>
                        <SidebarMenuButton><SettingsIcon />Admin</SidebarMenuButton>
                        <SidebarMenuButton><TerminalIcon />Terminal</SidebarMenuButton>
                        <SidebarMenuButton><FolderIcon />Files</SidebarMenuButton>
                        <SidebarMenuButton><PlayIcon />Media</SidebarMenuButton>
                        <SidebarMenuButton><ContainerIcon />Containers</SidebarMenuButton>
                        <SidebarMenuButton><MonitorIcon />Virtualisation</SidebarMenuButton>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
        {children}
    </SidebarProvider>
}