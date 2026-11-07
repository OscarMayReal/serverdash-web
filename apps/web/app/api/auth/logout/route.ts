import { sessionCookieName } from "@workspace/backend/auth"

export async function POST() {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` },
  })
}
