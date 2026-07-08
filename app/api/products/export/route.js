import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const COLUMNS = [
  "title", "brand", "asin", "price", "list_price", "currency", "coupon_code",
  "affiliate_url", "image_url", "rating", "review_count", "is_active",
  "is_featured", "is_lightning_deal", "source", "created_at",
];

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const header = COLUMNS.join(",");
  const rows = (products || []).map((p) => COLUMNS.map((c) => csvEscape(p[c])).join(","));
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="dirham-genie-products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
