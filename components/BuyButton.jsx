"use client";

export default function BuyButton({ productId, affiliateUrl }) {
  function handleClick() {
    // Fire-and-forget click tracking; never block the redirect on it.
    fetch("/api/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      onClick={handleClick}
      className="inline-block rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-6 py-3 text-sm transition-colors"
    >
      View Deal on Amazon.ae &rarr;
    </a>
  );
}
