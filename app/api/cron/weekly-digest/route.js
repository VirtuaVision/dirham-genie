import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { formatAed, discountPercent } from "@/lib/formatCurrency";
import slugify from "slugify";

async function buildDigest() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Prefer products that got clicks this week; fall back to biggest discounts
  // among recently active products if there's no click data yet.
  const { data: clicks } = await supabaseAdmin
    .from("clicks")
    .select("product_id")
    .gte("created_at", sevenDaysAgo);

  const counts = {};
  for (const c of clicks || []) {
    if (!c.product_id) continue;
    counts[c.product_id] = (counts[c.product_id] || 0) + 1;
  }
  const clickedIds = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  let products = [];
  if (clickedIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("*")
      .in("id", clickedIds)
      .eq("is_active", true);
    products = clickedIds.map((id) => data.find((p) => p.id === id)).filter(Boolean);
  }

  if (products.length < 4) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_active", true)
      .not("list_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);
    const extra = (data || [])
      .map((p) => ({ ...p, _discount: discountPercent(p.price, p.list_price) || 0 }))
      .sort((a, b) => b._discount - a._discount)
      .filter((p) => !products.some((existing) => existing.id === p.id))
      .slice(0, 8 - products.length);
    products = [...products, ...extra];
  }

  return products.slice(0, 8);
}

function formatDateRange() {
  const end = new Date();
  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

async function uniqueSlug(base) {
  let slug = slugify(base, { lower: true, strict: true });
  let attempt = 0;
  while (true) {
    const { data: existing } = await supabaseAdmin
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) return slug;
    attempt += 1;
    slug = `${slugify(base, { lower: true, strict: true })}-${attempt}`;
  }
}

async function createDigestPost() {
  const products = await buildDigest();
  if (products.length === 0) return { skipped: true, reason: "No active products to summarize yet." };

  const dateRange = formatDateRange();
  const title = `This Week's Best Deals (${dateRange})`;

  const intro = `Here are the standout Amazon.ae deals our genie unlocked this week. As always, prices may have changed since this was written — tap through to confirm before you buy.\n\n`;

  const body = products
    .map((p) => {
      const price = formatAed(p.price) || "See price on Amazon.ae";
      const discount = discountPercent(p.price, p.list_price);
      const discountNote = discount ? ` (${discount}% off)` : "";
      return `• ${p.title} — ${price}${discountNote}\n  ${p.affiliate_url}`;
    })
    .join("\n\n");

  const disclosure = `\n\nAs an Amazon Associate, Dirham Genie earns from qualifying purchases.`;

  const slug = await uniqueSlug(title);

  const { error } = await supabaseAdmin.from("posts").insert({
    title,
    slug,
    excerpt: `A roundup of ${products.length} great deals from ${dateRange}.`,
    content: intro + body + disclosure,
    cover_image_url: products[0]?.image_url || null,
    is_published: false, // drafted for review — publish manually in Admin → Blog Posts
  });

  if (error) throw new Error(error.message);
  return { created: true, title, productCount: products.length };
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await createDigestPost();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
