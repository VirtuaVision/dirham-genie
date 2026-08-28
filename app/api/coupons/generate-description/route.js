import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { generateCouponDescription } from "@/lib/generateCouponDescription";

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, code, affiliate_url } = await request.json();

  try {
    const description = await generateCouponDescription({ title, code, affiliate_url });
    return NextResponse.json({ description });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
