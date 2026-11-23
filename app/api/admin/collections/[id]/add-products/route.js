import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

// Adds products to the END of a collection's list without touching what's
// already there (unlike the editor's save, which replaces the whole list).
export async function POST(request, { params }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const incoming = (Array.isArray(body.product_ids) ? body.product_ids : []).map(String).filter(Boolean);
  if (incoming.length === 0) {
    return NextResponse.json({ error: "No products given." }, { status: 400 });
  }

  const { data: collection, error } = await supabaseAdmin
    .from("collections")
    .select("product_ids")
    .eq("id", params.id)
    .single();
  if (error) return NextResponse.json({ error: "That sale page wasn't found." }, { status: 404 });

  const existing = collection.product_ids || [];
  const have = new Set(existing.map(String));
  const fresh = incoming.filter((id) => !have.has(id));
  const merged = [...existing, ...fresh].slice(0, 500);

  if (fresh.length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("collections")
      .update({ product_ids: merged })
      .eq("id", params.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  return NextResponse.json({ added: fresh.length, alreadyThere: incoming.length - fresh.length });
}
