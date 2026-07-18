import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "dg_admin_session";
const secretKey = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSession({ email, role, remember = true }) {
  // Remembered: 30-day persistent cookie. Not remembered: session-only
  // cookie (cleared when the browser closes) with a shorter JWT lifetime.
  const expiresIn = remember ? "30d" : "1d";

  const token = await new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey());

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
  if (remember) {
    cookieOptions.maxAge = 60 * 60 * 24 * 30; // 30 days
  }
  // If not remembered, omit maxAge entirely — the browser treats it as a
  // session cookie and clears it when the browser fully closes.

  cookies().set(COOKIE_NAME, token, cookieOptions);
}

export function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload; // { email, role }
  } catch {
    return null;
  }
}

export async function isAdminLoggedIn() {
  const session = await getSession();
  return session?.role === "admin" || session?.role === "editor";
}

export async function isSuperAdminOrAdmin() {
  const session = await getSession();
  return session?.role === "admin";
}
