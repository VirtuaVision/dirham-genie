import { queryProducts } from "@/lib/queryProducts";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";

export const metadata = { title: "Latest Deals | Dirham Genie" };
export const revalidate = 60;

export default async function LatestDealsPage({ searchParams }) {
  const products = await queryProducts({
    sort: searchParams?.sort || "newest",
    minPrice: searchParams?.minPrice,
    maxPrice: searchParams?.maxPrice,
    minRating: searchParams?.minRating,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-gold mb-2">Latest Deals</h1>
      <p className="text-cream/60 text-sm mb-6">Freshly unlocked, newest first.</p>

      <FilterBar />

      {products.length === 0 ? (
        <p className="text-cream/50 text-sm">No deals match these filters yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
