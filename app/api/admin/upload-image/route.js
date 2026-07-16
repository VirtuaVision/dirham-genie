// Save as: app/api/admin/upload-image/route.js

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Please upload a PNG, JPG, WEBP, or GIF image." },
      { status: 400 }
    );
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("site-images")
    .upload(filename, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from("site-images").getPublicUrl(filename);
  return NextResponse.json({ url: data.publicUrl });
}
