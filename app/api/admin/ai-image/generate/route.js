import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { generatePremiumProductImage, DEFAULT_PROMPT_TEMPLATE } from "@/lib/aiImageGenerator";

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageUrl, prompt } = await request.json();
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl is required." }, { status: 400 });
  }

  try {
    const dataUrl = await generatePremiumProductImage({
      imageUrl,
      prompt: prompt || DEFAULT_PROMPT_TEMPLATE,
    });
    return NextResponse.json({ dataUrl });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}