import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { searchProductsByKeyword } from "@/lib/amazon";

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword } = await request.json();
  if (!keyword) {
    return NextResponse.json({ error: "Enter a keyword to search." }, { status: 400 });
  }

  try {
    const products = await searchProductsByKeyword(keyword);
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
