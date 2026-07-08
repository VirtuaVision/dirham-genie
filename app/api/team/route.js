import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isSuperAdminOrAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function GET() {
  if (!(await isSuperAdminOrAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function POST(request) {
  if (!(await isSuperAdminOrAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email, password, role } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .insert({
      email,
      password_hash: hashPassword(password),
      role: role === "admin" ? "admin" : "editor",
    })
    .select("id, email, role")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
