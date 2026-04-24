export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
        <div className="h-5 w-20 bg-muted rounded animate-pulse" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Hero skeleton */}
        <div className="bg-muted rounded-2xl p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted-foreground/20 shrink-0" />
            <div className="space-y-2">
              <div className="h-5 w-36 bg-muted-foreground/20 rounded" />
              <div className="h-4 w-24 bg-muted-foreground/15 rounded" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border p-4 text-center animate-pulse">
              <div className="h-4 w-4 bg-muted rounded mx-auto mb-2" />
              <div className="h-7 w-10 bg-muted rounded mx-auto mb-1" />
              <div className="h-3 w-14 bg-muted rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Cards skeleton */}
        {[160, 120, 100].map((h, i) => (
          <div key={i} className="rounded-xl border border-border p-5 animate-pulse">
            <div className="h-4 w-40 bg-muted rounded mb-4" />
            <div className="space-y-2">
              <div className="h-10 bg-muted rounded" />
              {i === 0 && <div className="h-4 w-48 bg-muted rounded" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
