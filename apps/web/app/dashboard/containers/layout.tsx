import type { Metadata } from "next"

export const metadata: Metadata = { title: { absolute: "Containers | ServerDash" } }

export default function ContainersLayout({ children }: { children: React.ReactNode }) {
  return children
}
