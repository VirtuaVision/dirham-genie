import { NextResponse } from "next/server";
import { isAdminLoggedIn, getSession } from "@/lib/auth";

// Lightweight, public-safe check — only returns a boolean and a role label,
// nothing sensitive. Used by the storefront to decide whether to show
// admin-only UI (like the "Share to Social" button on product cards), and
// by the admin sidebar to hide links an editor shouldn't see.
export async function GET() {
  const isAdmin = await isAdminLoggedIn();
  const session = await getSession();
  return NextResponse.json({ isAdmin, role: session?.role || null });
}