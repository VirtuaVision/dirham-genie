import Link from "next/link";
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

const OTHER = { slug: "other", name: "More deals" };

// Groups the page's products by their own category, keeping the order you
// arranged them in (a category appears where its first product appears).
function groupByCategory(products) {
  const groups = [];
  const byKey = new Map();
  for (const p of products) {
    const slug = p.categories?.slug || OTHER.slug;
    const name = p.categories?.name || OTHER.name;
    if (!byKey.has(slug)) {
      const group = { slug, name, products: [] };
      byKey.set(slug, group);
      groups.push(group);
    }
    byKey.get(slug).products.push(p);
  }
  return groups;
}

function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default async function CollectionPage({ params, searchParams }) {
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
    products = ids.map((id) => byId.get(String(id))).filter(Boolean);
  }

  const groups = groupByCategory(products);
  // Category buttons only make sense when the page spans 2+ categories.
  const showTabs = groups.length >= 2;
  const selected = showTabs ? groups.find((g) => g.slug === searchParams?.category) : null;
  const basePath = `/collection/${collection.slug}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-gold mb-2">{collection.title}</h1>
      {collection.description && (
        <p className="text-cream/65 text-sm md:text-base max-w-2xl mb-2 whitespace-pre-line">
          {collection.description}
        </p>
      )}
      <p className="text-cream/45 text-xs mb-5">
        {products.length} deal{products.length === 1 ? "" : "s"}
      </p>

      {showTabs && (
        <nav className="flex gap-2 overflow-x-auto pb-2 mb-6" aria-label="Categories in this sale">
          <Link
            href={basePath}
            className={`shrink-0 px-3.5 py-1.5 rounded-full border text-sm transition-colors ${
              !selected
                ? "bg-gold text-ink border-gold font-semibold"
                : "border-gold/30 text-cream/80 hover:border-gold hover:text-gold"
            }`}
          >
            All ({products.length})
          </Link>
          {groups.map((g) => (
            <Link
              key={g.slug}
              href={`${basePath}?category=${g.slug}`}
              className={`shrink-0 px-3.5 py-1.5 rounded-full border text-sm transition-colors ${
                selected?.slug === g.slug
                  ? "bg-gold text-ink border-gold font-semibold"
                  : "border-gold/30 text-cream/80 hover:border-gold hover:text-gold"
              }`}
            >
              {g.name} ({g.products.length})
            </Link>
          ))}
        </nav>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon="🪔"
          title="No deals here yet"
          subtitle="Check back soon — new picks are added regularly."
          actionLabel="Back to homepage"
          actionHref="/"
        />
      ) : selected ? (
        <section>
          <h2 className="font-display text-xl text-gold mb-4">{selected.name}</h2>
          <ProductGrid products={selected.products} />
        </section>
      ) : showTabs ? (
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.slug} id={g.slug}>
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <h2 className="font-display text-xl text-gold">
                  {g.name} <span className="text-sm text-cream/40 font-sans">({g.products.length})</span>
                </h2>
                <Link
                  href={`${basePath}?category=${g.slug}`}
                  className="text-xs text-gold underline shrink-0"
                >
                  See only {g.name} →
                </Link>
              </div>
              <ProductGrid products={g.products} />
            </section>
          ))}
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
