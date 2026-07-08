import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPassword } from "@/lib/password";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const superEmail = process.env.ADMIN_EMAIL;
  const superPassword = process.env.ADMIN_PASSWORD;

  // 1) Check the permanent super-admin account (from environment variables)
  if (superEmail && superPassword && email === superEmail && password === superPassword) {
    await createSession({ email, role: "admin" });
    return NextResponse.json({ ok: true });
  }

  // 2) Check team accounts stored in the database (Admin or Editor)
  const { data: user } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (user && verifyPassword(password, user.password_hash)) {
    await createSession({ email: user.email, role: user.role });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
}
