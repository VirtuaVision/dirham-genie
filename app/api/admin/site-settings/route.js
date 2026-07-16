// Save as: app/api/admin/site-settings/route.js

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin.from("site_settings").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const settings = {};
  (data || []).forEach((row) => (settings[row.key] = row.value));
  return NextResponse.json({ settings });
}

export async function PUT(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { key, value } = await request.json();
  if (!key) {
    return NextResponse.json({ error: "Setting key is required." }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
