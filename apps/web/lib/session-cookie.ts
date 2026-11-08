export function requestUsesHttps(request: Request) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase()
  if (forwardedProtocol) return forwardedProtocol === "https"
  return new URL(request.url).protocol === "https:"
}

export function expiredSessionCookie(request: Request, cookieName: string) {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${requestUsesHttps(request) ? "; Secure" : ""}`
}
