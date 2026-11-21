import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminLoggedIn } from "@/lib/auth";
import { pickCategoryId } from "@/lib/matchCategoryFromAmazon";

// Sorts products that have NO category into the best-fitting one, based on
// what the product is. Never changes a product that already has a category.
//   body.product_ids  -> only those products (e.g. the ones on a sale page)
//   no product_ids    -> up to 500 uncategorised products across the site
export async function POST(request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.product_ids) ? body.product_ids.map(String) : null;

  const { data: categories, error: catError } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug");
  if (catError) return NextResponse.json({ error: catError.message }, { status: 500 });

  let query = supabaseAdmin
    .from("products")
    .select("id, title, amazon_category")
    .is("category_id", null)
    .limit(500);
  if (ids) query = query.in("id", ids);
  const { data: products, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const idsByCategory = new Map();
  let unsure = 0;
  for (const p of products || []) {
    const categoryId = pickCategoryId(categories, p.title, p.amazon_category);
    if (!categoryId) {
      unsure += 1;
      continue;
    }
    if (!idsByCategory.has(categoryId)) idsByCategory.set(categoryId, []);
    idsByCategory.get(categoryId).push(p.id);
  }

  const byCategory = {};
  const updatedIds = [];
  for (const [categoryId, productIds] of idsByCategory) {
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({ category_id: categoryId })
      .in("id", productIds);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    const name = categories.find((c) => c.id === categoryId)?.name || "Other";
    byCategory[name] = (byCategory[name] || 0) + productIds.length;
    updatedIds.push(...productIds.map(String));
  }

  return NextResponse.json({
    checked: (products || []).length,
    updated: updatedIds.length,
    unsure,
    byCategory,
    updatedIds,
  });
}
