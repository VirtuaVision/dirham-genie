import { supabase } from "@/lib/supabaseClient";

export const metadata = { title: "Coupons | Dirham Genie" };
export const revalidate = 60;

export default async function CouponsPage() {
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-gold mb-2">Coupons</h1>
      <p className="text-cream/60 text-sm mb-8">
        Current Amazon.ae coupons and promo codes we&apos;ve found for you.
      </p>

      {!data || data.length === 0 ? (
        <p className="text-cream/50 text-sm">No active coupons right now. Check back soon!</p>
      ) : (
        <div className="space-y-4">
          {data.map((c) => (
            <div key={c.id} className="card-surface rounded-lg p-5">
              <h2 className="text-cream/90 font-semibold">{c.title}</h2>
              {c.description && (
                <p className="text-cream/60 text-sm mt-1">{c.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                {c.code && (
                  <span className="font-mono text-sm bg-gold/15 text-gold px-3 py-1 rounded border border-dashed border-gold/40">
                    {c.code}
                  </span>
                )}
                {c.affiliate_url && (
                  <a
                    href={c.affiliate_url}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="text-sm text-gold underline underline-offset-2 hover:text-gold-bright"
                  >
                    Shop this deal &rarr;
                  </a>
                )}
              </div>
              {c.expires_at && (
                <p className="text-xs text-cream/40 mt-2">
                  Expires {new Date(c.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-cream/40 mt-8">
        As an Amazon Associate, Dirham Genie earns from qualifying purchases.
      </p>
    </div>
  );
}
