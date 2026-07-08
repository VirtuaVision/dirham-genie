import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalClicks },
    { count: subscribers },
    { count: activeCoupons },
  ] = await Promise.all([
    supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabaseAdmin.from("clicks").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("coupons").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);
  return {
    totalProducts: totalProducts || 0,
    activeProducts: activeProducts || 0,
    totalClicks: totalClicks || 0,
    subscribers: subscribers || 0,
    activeCoupons: activeCoupons || 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Products", value: stats.totalProducts },
    { label: "Live on Site", value: stats.activeProducts },
    { label: "Total Affiliate Clicks", value: stats.totalClicks },
    { label: "Newsletter Subscribers", value: stats.subscribers },
    { label: "Active Coupons", value: stats.activeCoupons },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-6">Dashboard</h1>
      <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card-surface rounded-lg p-5">
            <p className="text-cream/50 text-xs uppercase tracking-wide">{c.label}</p>
            <p className="font-mono text-3xl text-gold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card-surface rounded-lg p-5 text-sm text-cream/70 leading-relaxed">
        <p className="text-gold font-semibold mb-2">Quick tips</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Use <strong>Add Product</strong> to paste an Amazon.ae link and auto-fetch title, image, and price.</li>
          <li>Or add a product fully manually if it&apos;s not on Amazon&apos;s API yet.</li>
          <li>Toggle &quot;Featured&quot; on a product to show it in the Genie&apos;s Picks section on the homepage.</li>
          <li>Uncheck &quot;Active&quot; to hide a product from the site without deleting it.</li>
        </ul>
      </div>
    </div>
  );
}
