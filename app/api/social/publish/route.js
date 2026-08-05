import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadGeneratedImage, postToFacebookPage, postToInstagram } from "@/lib/socialPost";
import { postToWhatsAppChannel } from "@/lib/whatsappChannel";

const ALL_PLATFORMS = ["facebook", "instagram", "whatsapp"];

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageDataUrl, caption, platforms } = await request.json();
  if (!imageDataUrl || !caption) {
    return NextResponse.json({ error: "Missing image or caption." }, { status: 400 });
  }

  const wanted = Array.isArray(platforms) && platforms.length ? platforms : ALL_PLATFORMS;

  let imageUrl;
  try {
    imageUrl = await uploadGeneratedImage(imageDataUrl);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const results = {};

  if (wanted.includes("facebook")) {
    try {
      results.facebook = await postToFacebookPage(imageUrl, caption);
    } catch (err) {
      results.facebook = { ok: false, error: err.message };
    }
  }

  if (wanted.includes("instagram")) {
    try {
      results.instagram = await postToInstagram(imageUrl, caption);
    } catch (err) {
      results.instagram = { ok: false, error: err.message };
    }
  }

  if (wanted.includes("whatsapp")) {
    try {
      results.whatsapp = await postToWhatsAppChannel(imageUrl, caption);
    } catch (err) {
      results.whatsapp = { ok: false, error: err.message };
    }
  }

  return NextResponse.json({ imageUrl, results });
}