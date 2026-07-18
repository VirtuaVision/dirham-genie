import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadAIImage } from "@/lib/aiImageGenerator";

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageDataUrl, productId, setAsMainImage } = await request.json();
  if (!imageDataUrl) {
    return NextResponse.json({ error: "imageDataUrl is required." }, { status: 400 });
  }

  let publicUrl;
  try {
    publicUrl = await uploadAIImage(imageDataUrl);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  if (productId) {
    const updates = { ai_image_url: publicUrl, updated_at: new Date().toISOString() };
    if (setAsMainImage) updates.image_url = publicUrl;

    const { error } = await supabaseAdmin.from("products").update(updates).eq("id", productId);
    if (error) {
      return NextResponse.json({ url: publicUrl, warning: `Uploaded, but couldn't save to product: ${error.message}` });
    }
  }

  return NextResponse.json({ url: publicUrl });
}