import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sessionCookieName, verifySessionToken } from "@workspace/backend/auth"
import { DashboardShell } from "./dashboard-shell"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "Overview | ServerDash" },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionCookieName)?.value
  if (!verifySessionToken(token)) {
    redirect("/api/auth/session-expired")
  }
  return <TooltipProvider><DashboardShell>{children}</DashboardShell></TooltipProvider>
}
