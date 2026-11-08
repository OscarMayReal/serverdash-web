import type { Metadata } from "next"

export const metadata: Metadata = { title: { absolute: "Files | ServerDash" } }

export default function FilesLayout({ children }: { children: React.ReactNode }) {
  return children
}
