import { NextResponse } from "next/server"

import { sessionCookieName } from "@workspace/backend/auth"
import { requestUsesHttps } from "@/lib/session-cookie"

export const runtime = "nodejs"

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url))
  response.cookies.set({
    name: sessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: requestUsesHttps(request),
    path: "/",
    maxAge: 0,
  })
  return response
}
