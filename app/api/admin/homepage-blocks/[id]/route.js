// Save as: app/api/admin/homepage-blocks/[id]/route.js

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

export async function PATCH(request, { params }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const update = {};
  if (body.config !== undefined) update.config = body.config;
  if (body.is_visible !== undefined) update.is_visible = body.is_visible;
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("homepage_blocks")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ block: data });
}

export async function DELETE(request, { params }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { error } = await supabaseAdmin.from("homepage_blocks").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
