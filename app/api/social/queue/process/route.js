import { NextResponse } from "next/server";
import { isAdminLoggedIn } from "@/lib/auth";
import { processDueQueuedPosts } from "@/lib/socialQueue";

export async function POST() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processed = await processDueQueuedPosts(10);
    return NextResponse.json({ processed: processed.length, results: processed });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}