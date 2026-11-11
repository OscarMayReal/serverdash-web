import { Button } from "@workspace/ui/components/button"
import { Greeting } from "./greeting"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: { absolute: "Welcome | ServerDash" },
}

export default function Page() {
  return redirect("/login")
}
