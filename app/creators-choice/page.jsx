import { Suspense } from "react";
import { queryProducts } from "@/lib/queryProducts";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import EmptyState from "@/components/EmptyState";

export const revalidate = 60;

export const metadata = {
  title: "Creators Choice | Dirham Genie",
  description: "Products hand-picked by our creators — browse every Creators Choice deal on Dirham Genie.",
  alternates: { canonical: "https://dirhamgenie.com/creators-choice" },
};

export default async function CreatorsChoicePage({ searchParams }) {
  const products = await queryProducts({
    creatorsChoiceOnly: true,
    sort: searchParams?.sort,
    minPrice: searchParams?.minPrice,
    maxPrice: searchParams?.maxPrice,
    minRating: searchParams?.minRating,
  });

  const pageUrl = "https://dirhamgenie.com/creators-choice";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dirhamgenie.com" },
      { "@type": "ListItem", position: 2, name: "Creators Choice", item: pageUrl },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://dirhamgenie.com/product/${p.slug}`,
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <nav className="text-xs text-cream/50 mb-2">
        <a href="/" className="hover:text-gold">Home</a> {" › "}
        <span className="text-cream/70">Creators Choice</span>
      </nav>
      <h1 className="font-display text-3xl text-gold mb-2">✨ Creators Choice</h1>
      <p className="text-cream/60 text-sm mb-6">
        {products.length} deal{products.length === 1 ? "" : "s"} hand-picked by our creators
      </p>

      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>

      {products.length === 0 ? (
        <EmptyState
          icon="✨"
          title="No Creators Choice deals yet"
          subtitle="Check back soon — new hand-picked deals are added regularly."
          actionLabel="Back to homepage"
          actionHref="/"
        />
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
