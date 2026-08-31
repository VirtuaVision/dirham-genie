import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { searchProductsByKeyword, rankBestProducts } from "@/lib/amazon";

const PAGES_TO_FETCH = 3; // 3 pages x 10 results = up to 30 raw candidates

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword, minDiscount } = await request.json();
  if (!keyword) {
    return NextResponse.json({ error: "Enter a keyword to search." }, { status: 400 });
  }

  try {
    // Amazon only returns up to 10 results per page, so fetch a few pages
    // and combine them — one page alone was silently capping every search
    // at 10 results regardless of how many actually matched.
    const pageResults = await Promise.allSettled(
      Array.from({ length: PAGES_TO_FETCH }, (_, i) => searchProductsByKeyword(keyword, i + 1))
    );
    const rawProducts = pageResults
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    // De-duplicate in case the same ASIN appears across pages.
    const seen = new Set();
    const unique = rawProducts.filter((p) => {
      if (seen.has(p.asin)) return false;
      seen.add(p.asin);
      return true;
    });

    const products = rankBestProducts(unique, unique.length, Number(minDiscount) || 0);
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}