import type { Metadata } from "next"

export const metadata: Metadata = { title: { absolute: "Terminal | ServerDash" } }

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return children
}
