import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request) {
  const { email, category_id, turnstileToken } = await request.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const humanVerified = await verifyTurnstile(turnstileToken);
  if (!humanVerified) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("deal_alerts")
    .insert({ email: email.toLowerCase().trim(), category_id: category_id || null });

  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
