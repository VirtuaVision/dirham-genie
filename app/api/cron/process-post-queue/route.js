import { NextResponse } from "next/server";
import { processDueQueuedPosts } from "@/lib/socialQueue";

export const maxDuration = 300;

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processed = await processDueQueuedPosts(10);
    return NextResponse.json({ processed: processed.length, results: processed });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}