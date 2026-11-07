import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sessionCookieName, verifySessionToken } from "@workspace/backend/auth"
import { DashboardShell } from "./dashboard-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(sessionCookieName)?.value
  if (!verifySessionToken(token)) redirect("/login")
  return <DashboardShell>{children}</DashboardShell>
}
