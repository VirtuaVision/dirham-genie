import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ product: null });
  }
  const product = data[Math.floor(Math.random() * data.length)];
  return NextResponse.json({ product });
}
