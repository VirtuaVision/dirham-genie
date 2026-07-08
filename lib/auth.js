import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "dg_admin_session";
const secretKey = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSession({ email, role }) {
  const token = await new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
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
