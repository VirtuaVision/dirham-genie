import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import ProductCard from "@/components/ProductCard";
import EmptyState from "@/components/EmptyState";

// Always read fresh data so product changes show up right after you save.
export const dynamic = "force-dynamic";

async function getCollection(slug) {
  const { data } = await supabaseAdmin
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const collection = await getCollection(params.slug);
  if (!collection) return { title: "Not found | Dirham Genie" };
  return {
    title: `${collection.title} | Dirham Genie`,
    description:
      collection.description || `${collection.title} — hand-picked Amazon.ae deals on Dirham Genie.`,
  };
}

export default async function CollectionPage({ params }) {
  const collection = await getCollection(params.slug);
  if (!collection) notFound();

  const ids = collection.product_ids || [];
  let products = [];
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("*, categories(name, slug)")
      .in("id", ids)
      .eq("is_active", true);
    const byId = new Map((data || []).map((p) => [String(p.id), p]));
    // keep the order you arranged them in
    products = ids.map((id) => byId.get(String(id))).filter(Boolean);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-gold mb-2">{collection.title}</h1>
      {collection.description && (
        <p className="text-cream/65 text-sm md:text-base max-w-2xl mb-2 whitespace-pre-line">
          {collection.description}
        </p>
      )}
      <p className="text-cream/45 text-xs mb-6">
        {products.length} deal{products.length === 1 ? "" : "s"}
      </p>

      {products.length === 0 ? (
        <EmptyState
          icon="🪔"
          title="No deals here yet"
          subtitle="Check back soon — new picks are added regularly."
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
