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

  // Multi-word search: each word must match SOMEWHERE (title, brand, or
  // description), and every word must be found (possibly in different
  // fields) for the product to count as a match. E.g. "casio black" now
  // matches a product titled "Watch, Black Dial" with brand "Casio" —
  // the old version only matched if the whole phrase appeared in the title.
  if (searchQuery) {
    const words = searchQuery
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.replace(/[%_,]/g, "")) // strip characters that would break the ILIKE pattern
      .filter(Boolean)
      .slice(0, 8); // sanity cap so a pasted paragraph can't blow up the query

    for (const word of words) {
      query = query.or(`title.ilike.%${word}%,brand.ilike.%${word}%,description.ilike.%${word}%`);
    }
  }

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