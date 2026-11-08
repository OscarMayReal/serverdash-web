"use client"

import { Button } from "@workspace/ui/components/button"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarProvider, SidebarRail, SidebarTrigger } from "@workspace/ui/components/sidebar"
import { ContainerIcon, FolderIcon, HomeIcon, MonitorIcon, PlayIcon, SettingsIcon, TerminalIcon, UserIcon, LogOutIcon } from "lucide-react"
import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { trpc } from "@/trpc/client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const currentUser = trpc.authRouter.me.useQuery()
  const hostname = trpc.infoRouter.hostname.useQuery()

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
    router.refresh()
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex h-[60px] flex-row items-center p-0">
          <Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger render={<TooltipTrigger render={<Button size="icon-sm" variant="ghost" className="ml-auto mr-0" aria-label={currentUser.data ? `Logged in as ${currentUser.data.username}` : "User account"}>
                  <UserIcon />
                </Button>} />} />
              <DropdownMenuContent>
                <DropdownMenuItem variant="destructive" onClick={() => logout()}><LogOutIcon />Log Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipContent>Logged in as {currentUser.data?.username}@{hostname.data}</TooltipContent>
          </Tooltip>
          <SidebarTrigger className="mr-3" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pt-0">
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenuButton isActive={pathname === "/dashboard"} onClick={() => router.push("/dashboard")}><HomeIcon />Home</SidebarMenuButton>
              {/* <SidebarMenuButton><SettingsIcon />Admin</SidebarMenuButton> */}
              <SidebarMenuButton isActive={pathname === "/dashboard/terminal"} onClick={() => router.push("/dashboard/terminal")}><TerminalIcon />Terminal</SidebarMenuButton>
              <SidebarMenuButton isActive={pathname === "/dashboard/files"} onClick={() => router.push("/dashboard/files")}><FolderIcon />Files</SidebarMenuButton>
              {/* <SidebarMenuButton><PlayIcon />Media</SidebarMenuButton> */}
              <SidebarMenuButton isActive={pathname === "/dashboard/containers"} onClick={() => router.push("/dashboard/containers")}><ContainerIcon />Containers</SidebarMenuButton>
              {/* <SidebarMenuButton><MonitorIcon />Virtualisation</SidebarMenuButton> */}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      {children}
    </SidebarProvider>
  )
}
