import { supabase } from "@/lib/supabaseClient";

/**
 * Fetches active products with optional filters/sorting, shared by category,
 * latest-deals, and search pages so they all behave consistently.
 *
 * options: { categoryId, searchQuery, sort, minPrice, maxPrice, minRating, limit }
 */
export async function queryProducts(options = {}) {
  const { categoryId, searchQuery, sort, minPrice, maxPrice, minRating, limit = 48 } = options;

  let query = supabase.from("products").select("*").eq("is_active", true);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));
  if (minRating) query = query.gte("rating", Number(minRating));

  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    case "rating":
      query = query.order("rating", { ascending: false, nullsFirst: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let results = data || [];

  // Discount-based sort has to happen in JS since it isn't a stored column
  if (sort === "discount") {
    results = results
      .map((p) => ({
        ...p,
        _discount:
          p.price && p.list_price && p.list_price > p.price
            ? Math.round(((p.list_price - p.price) / p.list_price) * 100)
            : 0,
      }))
      .sort((a, b) => b._discount - a._discount);
  }

  return results;
}
