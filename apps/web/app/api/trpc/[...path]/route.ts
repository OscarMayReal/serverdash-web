import type { NextRequest } from "next/server"
import { sessionCookieName } from "@workspace/backend/auth"
import { expiredSessionCookie } from "@/lib/session-cookie"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function proxy(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:3001"
  const target = new URL(`/api/trpc${request.nextUrl.pathname.replace(/^\/api\/trpc/, "")}${request.nextUrl.search}`, backendUrl)
  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("connection")

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    redirect: "manual",
    cache: "no-store",
  })

  const responseHeaders = new Headers(response.headers)
  if (response.status === 401) {
    responseHeaders.append(
      "Set-Cookie",
      expiredSessionCookie(request, sessionCookieName),
    )
  }

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders })
}

export const GET = proxy
export const POST = proxy
