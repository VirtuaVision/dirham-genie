export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-white/5 rounded-lg" />
        <div className="space-y-4">
          <div className="h-8 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
          <div className="h-10 bg-gold/10 rounded w-1/3" />
          <div className="h-10 bg-white/5 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
