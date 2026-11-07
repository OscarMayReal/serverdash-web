"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { KeyIcon } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(result.error ?? "Unable to log in.")
        return
      }
      router.replace("/dashboard")
      router.refresh()
    } catch {
      setError("Unable to reach the login service.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen flex-row">
      <div className="bg-primary flex h-full w-2/8 flex-col items-center justify-center">
        <h1 className="text-primary-foreground text-4xl font-light">ServerDash</h1>
      </div>
      <div className="flex h-full w-6/8 flex-col items-center justify-center">
        <form onSubmit={submit} className="flex w-[350px] flex-col gap-3">
          <div className="text-primary mb-2 text-3xl">Log In</div>
          <Input name="username" placeholder="Linux username" autoComplete="username" required />
          <Input name="password" placeholder="Password" type="password" autoComplete="current-password" required />
          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={loading}>
            <KeyIcon /> {loading ? "Logging in…" : "Log In"}
          </Button>
        </form>
      </div>
    </div>
  )
}
