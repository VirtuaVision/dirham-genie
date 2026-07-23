import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { queryProducts } from "@/lib/queryProducts";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import DealAlertForm from "@/components/DealAlertForm";
import EmptyState from "@/components/EmptyState";

export const revalidate = 60;

async function getCategory(slug) {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }) {
  const category = await getCategory(params.slug);
  if (!category) return { title: "Category not found | Dirham Genie" };
  const pageUrl = `https://dirhamgenie.com/category/${category.slug}`;
  return {
    title: `${category.name} Deals | Dirham Genie`,
    description: `Browse today's best ${category.name} deals in the UAE — real discounts, verified prices, updated daily on Dirham Genie.`,
    alternates: { canonical: pageUrl },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const category = await getCategory(params.slug);
  if (!category) notFound();

  const products = await queryProducts({
    categoryId: category.id,
    sort: searchParams?.sort,
    minPrice: searchParams?.minPrice,
    maxPrice: searchParams?.maxPrice,
    minRating: searchParams?.minRating,
  });

  const pageUrl = `https://dirhamgenie.com/category/${category.slug}`;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dirhamgenie.com" },
      { "@type": "ListItem", position: 2, name: category.name, item: pageUrl },
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
        <span className="text-cream/70">{category.name}</span>
      </nav>
      <h1 className="font-display text-3xl text-gold mb-2">{category.name}</h1>
      <p className="text-cream/60 text-sm mb-6">
        {products.length} deal{products.length === 1 ? "" : "s"} unlocked in this category
      </p>

      <Suspense fallback={null}>
        <FilterBar />
      </Suspense>

      <div className="mb-6 max-w-md">
        <DealAlertForm defaultCategoryId={category.id} />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No deals match these filters yet"
          subtitle="Try clearing a filter, or check back soon as we add more products."
          actionLabel="Clear filters"
          actionHref={`/category/${category.slug}`}
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