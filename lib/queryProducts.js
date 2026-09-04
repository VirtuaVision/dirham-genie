import { supabase } from "@/lib/supabaseClient";

export async function queryProducts(options = {}) {
  const {
    categoryId,
    categorySlug,
    searchQuery,
    sort,
    minPrice,
    maxPrice,
    minRating,
    limit = 48,
    page,
    pageSize,
    countOnly = false,
  } = options;

  // Callers can pass either an already-known categoryId (category pages,
  // where it's fetched once up front) or a categorySlug (the homepage,
  // which only has the slug from the URL). Resolve the slug here so both
  // work the same way below.
  let resolvedCategoryId = categoryId;
  if (!resolvedCategoryId && categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    resolvedCategoryId = category?.id || null;
    // Slug given but no matching category — that's zero results, not "ignore the filter".
    if (!resolvedCategoryId) return countOnly ? 0 : [];
  }

  // Free-text search runs through a Postgres RPC that returns everything
  // matching, ranked — so pagination/counting here happens in memory
  // rather than as a second round-trip to the database.
  if (searchQuery) {
    const { data, error } = await supabase.rpc("search_products", {
      search_term: searchQuery.trim(),
      limit_count: 200,
    });
    if (error) throw new Error(error.message);
    let results = data || [];

    if (resolvedCategoryId) results = results.filter((p) => p.category_id === resolvedCategoryId);
    if (minPrice) results = results.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) results = results.filter((p) => p.price <= Number(maxPrice));
    if (minRating) results = results.filter((p) => p.rating >= Number(minRating));

    if (sort && sort !== "newest") {
      results = applySort(results, sort);
    }

    if (countOnly) return results.length;
    if (page && pageSize) {
      const start = (page - 1) * pageSize;
      return results.slice(start, start + pageSize);
    }
    return results.slice(0, limit);
  }

  if (countOnly) {
    let countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    if (resolvedCategoryId) countQuery = countQuery.eq("category_id", resolvedCategoryId);
    if (minPrice) countQuery = countQuery.gte("price", Number(minPrice));
    if (maxPrice) countQuery = countQuery.lte("price", Number(maxPrice));
    if (minRating) countQuery = countQuery.gte("rating", Number(minRating));

    const { count, error } = await countQuery;
    if (error) throw new Error(error.message);
    return count || 0;
  }

  let query = supabase.from("products").select("*").eq("is_active", true);
  if (resolvedCategoryId) query = query.eq("category_id", resolvedCategoryId);
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

  if (page && pageSize) {
    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);
  } else {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let results = data || [];

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
