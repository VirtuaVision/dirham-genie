import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { cancelQueuedPost } from "@/lib/socialQueue";

export async function DELETE(request, { params }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cancelled = await cancelQueuedPost(params.id);
    if (!cancelled) {
      return NextResponse.json({ error: "Already posted or not found — can't cancel." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}