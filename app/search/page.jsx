import { queryProducts } from "@/lib/queryProducts";
import { searchProductsByKeyword, rankBestProducts } from "@/lib/amazon";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import EmptyState from "@/components/EmptyState";
import AmazonLiveResults from "@/components/AmazonLiveResults";

export const revalidate = 0;

async function getLiveAmazonResults(query) {
  try {
    const results = await searchProductsByKeyword(query);
    const ranked = rankBestProducts(results, 6);

    // Amazon's search endpoint doesn't reliably include savings/list-price
    // data on every call for the same query — sometimes a refetch a moment
    // later returns it and sometimes it doesn't. If this response came back
    // unusually sparse (almost nothing has a discount), try once more
    // rather than showing a mostly-discount-less set to visitors.
    const withDiscount = ranked.filter((p) => p.list_price && p.list_price > p.price).length;
    if (ranked.length > 0 && withDiscount === 0) {
      const retry = await searchProductsByKeyword(query);
      const rerankedRetry = rankBestProducts(retry, 6);
      const retryWithDiscount = rerankedRetry.filter(
        (p) => p.list_price && p.list_price > p.price
      ).length;
      if (retryWithDiscount > 0) return rerankedRetry;
    }

    return ranked;
  } catch {
    // Amazon keys not configured yet, or the API call failed — fail quietly,
    // the page still works fine with just local results.
    return [];
  }
}

export default async function SearchPage({ searchParams }) {
  const query = searchParams?.q?.trim() || "";
  const results = query
    ? await queryProducts({
        searchQuery: query,
        sort: searchParams?.sort,
        minPrice: searchParams?.minPrice,
        maxPrice: searchParams?.maxPrice,
        minRating: searchParams?.minRating,
      })
    : [];

  // Only bother calling Amazon's live API if our own site came up short —
  // saves your daily API quota for when it's actually useful.
  const liveResults = query && results.length < 6 ? await getLiveAmazonResults(query) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl text-gold mb-2">
        {query ? `Results for "${query}"` : "Search Dirham Genie"}
      </h1>
      <p className="text-cream/60 text-sm mb-6">
        {query
          ? `${results.length} deal${results.length === 1 ? "" : "s"} found`
          : "Type something in the search bar above to find a deal."}
      </p>

      {query && <FilterBar />}

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