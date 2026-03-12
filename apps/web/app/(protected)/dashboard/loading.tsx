export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Header skeleton */}
      <div className="h-8 w-40 rounded bg-neutral-200" />

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="mb-2 h-3 w-20 rounded bg-neutral-200" />
            <div className="h-7 w-16 rounded bg-neutral-200" />
          </div>
        ))}
      </div>

      {/* Module placeholders */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="mb-4 h-5 w-32 rounded bg-neutral-200" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-neutral-200" />
              <div className="h-4 w-3/4 rounded bg-neutral-200" />
              <div className="h-4 w-1/2 rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
