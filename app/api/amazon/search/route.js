import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { searchProductsByKeyword, rankBestProducts } from "@/lib/amazon";

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword, minDiscount } = await request.json();
  if (!keyword) {
    return NextResponse.json({ error: "Enter a keyword to search." }, { status: 400 });
  }

  try {
    const rawProducts = await searchProductsByKeyword(keyword);
    // Filter by the selected minimum discount and sort by quality — pass
    // rawProducts.length as the limit so we don't silently truncate to
    // the function's small default of 6 results.
    const products = rankBestProducts(rawProducts, rawProducts.length, Number(minDiscount) || 0);
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}