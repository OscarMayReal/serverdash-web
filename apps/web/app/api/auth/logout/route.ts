import { sessionCookieName } from "@workspace/backend/auth"
import { expiredSessionCookie } from "@/lib/session-cookie"

export async function POST(request: Request) {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": expiredSessionCookie(request, sessionCookieName) },
  })
}
