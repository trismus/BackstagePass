export default function AuffuehrungenLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded bg-neutral-200" />
        <div className="h-9 w-32 rounded bg-neutral-200" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {/* Table header */}
        <div className="flex gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <div className="h-4 w-1/4 rounded bg-neutral-200" />
          <div className="h-4 w-1/6 rounded bg-neutral-200" />
          <div className="h-4 w-1/6 rounded bg-neutral-200" />
          <div className="h-4 w-1/6 rounded bg-neutral-200" />
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 border-b border-neutral-100 px-4 py-3">
            <div className="h-4 w-1/4 rounded bg-neutral-200" />
            <div className="h-4 w-1/6 rounded bg-neutral-200" />
            <div className="h-4 w-1/6 rounded bg-neutral-200" />
            <div className="h-4 w-1/6 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
