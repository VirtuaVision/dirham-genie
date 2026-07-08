import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadGeneratedImage, postToFacebookPage, postToInstagram } from "@/lib/socialPost";

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageDataUrl, caption } = await request.json();
  if (!imageDataUrl || !caption) {
    return NextResponse.json({ error: "Missing image or caption." }, { status: 400 });
  }

  let imageUrl;
  try {
    imageUrl = await uploadGeneratedImage(imageDataUrl);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const results = {};

  try {
    results.facebook = await postToFacebookPage(imageUrl, caption);
  } catch (err) {
    results.facebook = { ok: false, error: err.message };
  }

  try {
    results.instagram = await postToInstagram(imageUrl, caption);
  } catch (err) {
    results.instagram = { ok: false, error: err.message };
  }

  return NextResponse.json({ imageUrl, results });
}
