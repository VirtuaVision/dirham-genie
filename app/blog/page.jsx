import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const metadata = { title: "Blog & News | Dirham Genie" };
export const revalidate = 120;

export default async function BlogPage() {
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl text-gold mb-2">Blog &amp; News</h1>
      <p className="text-cream/60 text-sm mb-8">Deal roundups, buying guides, and UAE shopping tips.</p>

      {!data || data.length === 0 ? (
        <p className="text-cream/50 text-sm">No posts yet.</p>
      ) : (
        <div className="space-y-6">
          {data.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="card-surface rounded-lg p-5 flex gap-4 hover:border-gold/50 transition-colors"
            >
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt=""
                  className="w-24 h-24 object-cover rounded shrink-0"
                />
              )}
              <div>
                <h2 className="text-cream/90 font-semibold">{post.title}</h2>
                {post.excerpt && <p className="text-cream/60 text-sm mt-1">{post.excerpt}</p>}
                <p className="text-xs text-cream/40 mt-2">
                  {new Date(post.published_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
