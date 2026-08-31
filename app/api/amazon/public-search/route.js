import { NextResponse } from "next/server";
import { searchProductsByKeyword, rankBestProducts } from "@/lib/amazon";

const PAGES_TO_FETCH = 3; // up to 30 raw candidates before filtering
const RESULTS_LIMIT = 16; // shown to visitors, up from the old cap of 6

// Public on purpose — this powers the storefront's "Search Amazon.ae
// directly" bar, so any visitor can use it. No admin auth required, but
// keep an eye on Amazon API usage if this gets heavy traffic, since each
// search here costs a few real API calls.
export async function POST(request) {
  const { keyword, minDiscount } = await request.json();
  if (!keyword || !keyword.trim()) {
    return NextResponse.json({ error: "Enter something to search for." }, { status: 400 });
  }

  try {
    const pageResults = await Promise.allSettled(
      Array.from({ length: PAGES_TO_FETCH }, (_, i) => searchProductsByKeyword(keyword, i + 1))
    );
    const rawProducts = pageResults
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const seen = new Set();
    const unique = rawProducts.filter((p) => {
      if (seen.has(p.asin)) return false;
      seen.add(p.asin);
      return true;
    });

    const products = rankBestProducts(unique, RESULTS_LIMIT, Number(minDiscount) || 0);
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}