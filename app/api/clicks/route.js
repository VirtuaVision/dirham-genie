import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }
  await supabase.from("clicks").insert({ product_id: productId });
  return NextResponse.json({ ok: true });
}
