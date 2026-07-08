export default function StarRating({ rating, reviewCount, size = "text-sm" }) {
  if (!rating) return null;

  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className={`flex items-center gap-1 ${size}`}>
      <span className="text-gold tracking-tight">
        {"★".repeat(full)}
        {hasHalf && "⯨"}
        <span className="text-cream/20">{"★".repeat(empty)}</span>
      </span>
      <span className="text-cream/50 text-xs">
        {rating}{reviewCount ? ` (${reviewCount})` : ""}
      </span>
    </div>
  );
}
