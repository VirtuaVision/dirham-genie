import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const { data, error } = await supabase.rpc("search_products", {
    search_term: q,
    limit_count: 6,
  });

  if (error) {
    return NextResponse.json({ products: [] });
  }

  return NextResponse.json({ products: data || [] });
}