import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";

// Lightweight, public-safe check — only returns a boolean, nothing sensitive.
// Used by the storefront to decide whether to show admin-only UI (like the
// "Share to Social" button on product cards) without exposing any admin
// routes or data to regular visitors.
export async function GET() {
  const isAdmin = await isAdminLoggedIn();
  return NextResponse.json({ isAdmin });
}