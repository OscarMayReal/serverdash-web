import type { Metadata } from "next"

export const metadata: Metadata = { title: { absolute: "Administration | ServerDash" } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
