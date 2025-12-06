import crypto from "crypto";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "admin_session";

function computeSignature(email: string, password: string, secret: string) {
  return crypto
    .createHash("sha256")
    .update(`${email}|${password}|${secret}`)
    .digest("hex");
}

export function createSessionCookie(email: string, password: string) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  const signature = computeSignature(email, password, secret);
  return signature;
}

export function validateAdmin(req: NextRequest) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET;
  if (!email || !password || !secret) return false;

  const expected = computeSignature(email, password, secret);
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  return cookie === expected;
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}
