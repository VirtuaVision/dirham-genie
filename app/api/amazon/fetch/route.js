import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { fetchProductByAsin } from "@/lib/amazon";

function extractAsin(input) {
  const trimmed = input.trim();
  // If it looks like a full Amazon URL, pull the ASIN out of it.
  const match = trimmed.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  if (match) return match[1].toUpperCase();
  // Otherwise assume they pasted the ASIN directly.
  if (/^[A-Z0-9]{10}$/i.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { input } = await request.json();
  if (!input) {
    return NextResponse.json({ error: "Paste an Amazon.ae URL or ASIN." }, { status: 400 });
  }

  const asin = extractAsin(input);
  if (!asin) {
    return NextResponse.json(
      { error: "Couldn't find a valid ASIN in that link. Try pasting the direct product page URL." },
      { status: 400 }
    );
  }

  try {
    const product = await fetchProductByAsin(asin);
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
