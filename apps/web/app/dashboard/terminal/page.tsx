"use client"

import dynamic from "next/dynamic"

const TerminalSession = dynamic(() => import("./terminal-session"), { ssr: false })

export default function TerminalPage() {
  return <TerminalSession />
}
