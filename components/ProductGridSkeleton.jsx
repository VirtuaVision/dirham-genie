export default function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-surface rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-square bg-white/5" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-white/10 rounded w-full" />
            <div className="h-3 bg-white/10 rounded w-2/3" />
            <div className="h-4 bg-gold/10 rounded w-1/2 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
