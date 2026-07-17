import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids, action } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No products selected." }, { status: 400 });
  }

  if (action === "delete") {
    const { error } = await supabaseAdmin.from("products").delete().in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "deleted", count: ids.length });
  }

  if (action === "uncategorize") {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ category_id: null })
      .in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "uncategorized", count: ids.length });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}