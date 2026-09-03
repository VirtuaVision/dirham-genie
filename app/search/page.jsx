import { queryProducts } from "@/lib/queryProducts";
import { searchProductsByKeyword, rankBestProducts } from "@/lib/amazon";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import EmptyState from "@/components/EmptyState";
import AmazonLiveResults from "@/components/AmazonLiveResults";

export const revalidate = 0;

const CACHE_MAX_AGE_MS = 60 * 60 * 1000;
const PAGES_TO_FETCH = 3;
const AMAZON_MODE_RESULTS_LIMIT = 16;

async function getLiveAmazonResults(query, { forceAmazon = false } = {}) {
  const cacheKey = query.trim().toLowerCase() + (forceAmazon ? ":amazon" : "");
  try {
    const { data: cached } = await supabase
      .from("search_cache")
      .select("results, cached_at")
      .eq("query", cacheKey)
      .maybeSingle();

    if (cached && Date.now() - new Date(cached.cached_at).getTime() < CACHE_MAX_AGE_MS) {
      return cached.results;
    }

    let ranked;
    if (forceAmazon) {
      // Header search now goes straight to Amazon — pull a few pages so
      // there's a proper amount to show, not just the first 6.
      const pageResults = await Promise.allSettled(
        Array.from({ length: PAGES_TO_FETCH }, (_, i) => searchProductsByKeyword(query, i + 1))
      );
      const rawProducts = pageResults
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value);
      const seen = new Set();
      const unique = rawProducts.filter((p) => {
        if (seen.has(p.asin)) return false;
        seen.add(p.asin);
        return true;
      });
      ranked = rankBestProducts(unique, AMAZON_MODE_RESULTS_LIMIT);
    } else {
      const results = await searchProductsByKeyword(query);
      ranked = rankBestProducts(results, 6);
    }

    supabase
      .from("search_cache")
      .upsert({ query: cacheKey, results: ranked, cached_at: new Date().toISOString() })
      .then(() => {})
      .catch(() => {});

    return ranked;
  } catch {
    return [];
  }
}

export default async function SearchPage({ searchParams }) {
  const query = searchParams?.q?.trim() || "";
  const searchAmazonDirectly = searchParams?.source === "amazon";

  // When the header search bar sends someone here, go straight to Amazon —
  // skip the site's own catalog lookup entirely.
  const results = query && !searchAmazonDirectly
    ? await queryProducts({
        searchQuery: query,
        sort: searchParams?.sort,
        minPrice: searchParams?.minPrice,
        maxPrice: searchParams?.maxPrice,
        minRating: searchParams?.minRating,
      })
    : [];

  const liveResults = query
    ? searchAmazonDirectly
      ? await getLiveAmazonResults(query, { forceAmazon: true })
      : results.length < 6
      ? await getLiveAmazonResults(query)
      : []
    : [];

  if (query) {
    const totalFound = results.length + liveResults.length;
    supabase
      .from("search_logs")
      .insert({ query: query.toLowerCase(), result_count: totalFound })
      .then(() => {})
      .catch(() => {});
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl text-gold mb-2">
        {query ? `Results for "${query}"` : "Search Dirham Genie"}
      </h1>
      <p className="text-cream/60 text-sm mb-6">
        {query
          ? searchAmazonDirectly
            ? `${liveResults.length} result${liveResults.length === 1 ? "" : "s"} found on Amazon.ae`
            : `${results.length} deal${results.length === 1 ? "" : "s"} found`
          : "Type something in the search bar above to find a deal."}
      </p>

      {query && !searchAmazonDirectly && <FilterBar />}

      {query && results.length === 0 && liveResults.length === 0 && (
        <EmptyState
          icon="🔍"
          title="The genie couldn't find anything matching that"
          subtitle="Try a different word, or browse deals by category instead."
          actionLabel="Browse Latest Deals"
          actionHref="/deals/latest"
        />
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {liveResults.length > 0 && <AmazonLiveResults products={liveResults} />}
    </div>
  );
}