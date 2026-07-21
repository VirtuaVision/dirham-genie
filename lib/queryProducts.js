import { supabase } from "@/lib/supabaseClient";

export async function queryProducts(options = {}) {
  const { categoryId, searchQuery, sort, minPrice, maxPrice, minRating, limit = 48 } = options;

  let results = [];

  if (searchQuery) {
    // Fuzzy, typo-tolerant, relevance-ranked search via the search_products
    // database function — then any extra filters get applied in-memory
    // on that (already small) result set.
    const { data, error } = await supabase.rpc("search_products", {
      search_term: searchQuery.trim(),
      limit_count: 200,
    });
    if (error) throw new Error(error.message);
    results = data || [];

    if (categoryId) results = results.filter((p) => p.category_id === categoryId);
    if (minPrice) results = results.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) results = results.filter((p) => p.price <= Number(maxPrice));
    if (minRating) results = results.filter((p) => p.rating >= Number(minRating));

    // Relevance order from the database is the default; only override it
    // if the person explicitly picked a different sort.
    if (sort && sort !== "newest") {
      results = applySort(results, sort);
    }
    return results.slice(0, limit);
  }

  // No search text — plain filtered/sorted browse, same as before.
  let query = supabase.from("products").select("*").eq("is_active", true);
  if (categoryId) query = query.eq("category_id", categoryId);
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
  results = data || [];

  if (sort === "discount") results = applySort(results, "discount");
  return results;
}

function applySort(results, sort) {
  if (sort === "price_asc") return [...results].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if (sort === "price_desc") return [...results].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  if (sort === "rating") return [...results].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  if (sort === "discount") {
    return [...results]
      .map((p) => ({
        ...p,
        _discount: p.price && p.list_price && p.list_price > p.price
          ? Math.round(((p.list_price - p.price) / p.list_price) * 100) : 0,
      }))
      .sort((a, b) => b._discount - a._discount);
  }
  return results;
}