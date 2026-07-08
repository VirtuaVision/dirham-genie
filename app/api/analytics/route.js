import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

function groupByDay(rows, dateField) {
  const counts = {};
  for (const row of rows) {
    const day = row[dateField].slice(0, 10); // YYYY-MM-DD
    counts[day] = (counts[day] || 0) + 1;
  }
  return counts;
}

function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: clicks }, { data: subscribers }] = await Promise.all([
    supabaseAdmin.from("clicks").select("created_at").gte("created_at", thirtyDaysAgo),
    supabaseAdmin.from("newsletter_subscribers").select("subscribed_at").gte("subscribed_at", thirtyDaysAgo),
  ]);

  const days = last30Days();
  const clickCounts = groupByDay(clicks || [], "created_at");
  const subCounts = groupByDay(subscribers || [], "subscribed_at");

  return NextResponse.json({
    clicksByDay: days.map((d) => ({ date: d, count: clickCounts[d] || 0 })),
    subscribersByDay: days.map((d) => ({ date: d, count: subCounts[d] || 0 })),
  });
}
