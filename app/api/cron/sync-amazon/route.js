import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import { fetchProductsByAsins, chunkArray } from "@/lib/amazon";

async function runSync() {
  let checked = 0;
  let updated = 0;
  let errors = 0;
  const errorMessages = [];

  // 1) Refresh live data for every product that came from the Amazon API,
  // batching up to 10 ASINs per request (Amazon's per-request limit).
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, asin, price")
    .eq("source", "amazon_api")
    .eq("is_active", true)
    .not("asin", "is", null);

  const byAsin = new Map((products || []).map((p) => [p.asin, p]));
  const asinBatches = chunkArray([...byAsin.keys()], 10);

  for (const batch of asinBatches) {
    checked += batch.length;
    try {
      const freshItems = await fetchProductsByAsins(batch);

      for (const fresh of freshItems) {
        const product = byAsin.get(fresh.asin);
        if (!product) continue;

        const priceChanged = fresh.price && fresh.price !== product.price;

        await supabaseAdmin
          .from("products")
          .update({
            price: fresh.price,
            list_price: fresh.list_price,
            image_url: fresh.image_url,
            rating: fresh.rating,
            review_count: fresh.review_count,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (priceChanged) {
          await supabaseAdmin
            .from("price_history")
            .insert({ product_id: product.id, price: fresh.price });
          updated += 1;
        }
      }
    } catch (err) {
      errors += batch.length;
      errorMessages.push(`Batch [${batch.join(", ")}]: ${err.message}`);
    }
  }

  // 2) Expired-deal detection: turn off lightning-deal status once the deadline passes
  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from("products")
    .update({ is_lightning_deal: false })
    .lt("deal_expires_at", nowIso)
    .eq("is_lightning_deal", true);

  await supabaseAdmin
    .from("coupons")
    .update({ is_active: false })
    .lt("expires_at", nowIso)
    .eq("is_active", true);

  const summary = {
    products_checked: checked,
    products_updated: updated,
    errors,
    details: errorMessages.join("\n") || null,
  };

  await supabaseAdmin.from("sync_logs").insert(summary);
  return summary;
}

// Called automatically by your scheduler (Vercel Cron and/or an external
// service like cron-job.org), secured with CRON_SECRET
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runSync();
  return NextResponse.json(summary);
}

// Called from the admin panel's "Run Sync Now" button
export async function POST() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runSync();
  return NextResponse.json(summary);
}
