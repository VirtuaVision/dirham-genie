import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { uploadGeneratedImage } from "@/lib/socialPost";
import { createQueuedPost, listQueuedPosts } from "@/lib/socialQueue";

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const posts = await listQueuedPosts();
    return NextResponse.json({ posts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageDataUrl, caption, platforms, scheduledFor } = await request.json();
  if (!imageDataUrl || !caption || !platforms?.length || !scheduledFor) {
    return NextResponse.json({ error: "Missing image, caption, platforms, or schedule time." }, { status: 400 });
  }

  try {
    const imageUrl = await uploadGeneratedImage(imageDataUrl);
    const post = await createQueuedPost({ imageUrl, caption, platforms, scheduledFor });
    return NextResponse.json({ post });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}