import { createHmac, timingSafeEqual } from "node:crypto"

const SESSION_TTL_SECONDS = 60 * 60 * 12
const COOKIE_NAME = "serverdash_session"

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters")
  return value
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

export function createSessionToken(username: string) {
  const payload = Buffer.from(JSON.stringify({ username, expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString("base64url")
  return `${payload}.${signature(payload)}`
}

export function verifySessionToken(token?: string) {
  if (!token) return null
  const [payload, suppliedSignature] = token.split(".")
  if (!payload || !suppliedSignature) return null
  const expected = Buffer.from(signature(payload))
  const supplied = Buffer.from(suppliedSignature)
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as { username?: unknown; expiresAt?: unknown }
    if (typeof session.username !== "string" || typeof session.expiresAt !== "number" || session.expiresAt <= Date.now() / 1000) return null
    return { username: session.username }
  } catch {
    return null
  }
}

export const sessionCookieName = COOKIE_NAME
export const sessionTtlSeconds = SESSION_TTL_SECONDS
