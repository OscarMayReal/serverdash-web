import { pamAuthenticatePromise } from "node-linux-pam"
import { createSessionToken, sessionCookieName, sessionTtlSeconds } from "@workspace/backend/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Enter a valid username and password." }, { status: 400 })
  }

  const { username, password } = (body ?? {}) as { username?: unknown; password?: unknown }
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password || username.length > 128 || password.length > 1024) {
    return Response.json({ error: "Enter a valid username and password." }, { status: 400 })
  }

  try {
    await pamAuthenticatePromise({ username: username.trim(), password, serviceName: process.env.PAM_SERVICE ?? "login" })
    const token = createSessionToken(username.trim())
    return Response.json(
      { success: true },
      {
        headers: {
          "Set-Cookie": `${sessionCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionTtlSeconds}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
          "Cache-Control": "no-store",
        },
      },
    )
  } catch {
    return Response.json({ error: "Invalid username or password." }, { status: 401, headers: { "Cache-Control": "no-store" } })
  }
}
