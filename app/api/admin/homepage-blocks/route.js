// Save as: app/api/admin/homepage-blocks/route.js

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import { defaultConfigFor } from "@/lib/homepageBlocks";

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from("homepage_blocks")
    .select("*")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blocks: data });
}

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { type } = await request.json();
  if (!type) {
    return NextResponse.json({ error: "Block type is required." }, { status: 400 });
  }

  // New blocks go to the end of the list.
  const { data: existing } = await supabaseAdmin
    .from("homepage_blocks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = existing?.length ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabaseAdmin
    .from("homepage_blocks")
    .insert({ type, config: defaultConfigFor(type), sort_order: nextOrder, is_visible: true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ block: data });
}

// Bulk reorder — body: { order: [blockId, blockId, ...] } in the new order.
export async function PUT(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { order } = await request.json();
  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order must be an array of block ids." }, { status: 400 });
  }

  const updates = order.map((id, index) =>
    supabaseAdmin.from("homepage_blocks").update({ sort_order: index }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
