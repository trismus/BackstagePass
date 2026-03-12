export default function ProtectedLoading() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Header skeleton */}
      <div className="h-8 w-48 rounded bg-neutral-200" />

      {/* Card skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="mb-3 h-4 w-1/3 rounded bg-neutral-200" />
            <div className="mb-2 h-4 w-2/3 rounded bg-neutral-200" />
            <div className="h-4 w-1/2 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
