import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

export async function PUT(request, { params }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();

  // Only these fields can be changed from the admin page.
  const update = {};
  if ("code" in body) {
    const code = (body.code || "").trim();
    if (!code) return NextResponse.json({ error: "Coupon code can't be empty." }, { status: 400 });
    update.code = code;
  }
  if ("label" in body) update.label = (body.label || "").trim() || null;
  if ("is_active" in body) update.is_active = !!body.is_active;

  const { data, error } = await supabaseAdmin
    .from("popup_coupon_codes")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data });
}

export async function DELETE(request, { params }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { error } = await supabaseAdmin.from("popup_coupon_codes").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
