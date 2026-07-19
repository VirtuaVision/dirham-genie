import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 120;

async function getPost(slug) {
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
  return data;
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  if (!post) return { title: "Post not found | Dirham Genie" };
  return {
    title: `${post.title} | Dirham Genie`,
    description: post.excerpt,
    alternates: { canonical: `https://dirhamgenie.com/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at,
    author: { "@type": "Organization", name: "Dirham Genie" },
    publisher: {
      "@type": "Organization",
      name: "Dirham Genie",
      logo: { "@type": "ImageObject", url: "https://dirhamgenie.com/logo-dirham-genie.png" },
    },
  };

  return (
    <article className="max-w-2xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt=""
          className="w-full aspect-video object-cover rounded-lg mb-6"
        />
      )}
      <h1 className="font-display text-3xl text-gold mb-2">{post.title}</h1>
      <p className="text-xs text-cream/40 mb-6">
        {new Date(post.published_at).toLocaleDateString()}
      </p>
      <div className="text-cream/80 leading-relaxed whitespace-pre-line text-sm md:text-base">
        {post.content}
      </div>
    </article>
  );
}