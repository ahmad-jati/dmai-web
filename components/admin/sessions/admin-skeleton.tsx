'use client'

export function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 animate-pulse">
        <div className="h-6 bg-muted rounded w-56" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-4 bg-white border border-border rounded-sm animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-muted rounded-sm shrink-0" />
              <div className="flex flex-col gap-1 flex-1">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2.5 bg-muted/60 rounded w-1/2" />
              </div>
            </div>
            <div className="h-2.5 bg-muted/50 rounded w-full" />
            <div className="h-2.5 bg-muted/40 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
