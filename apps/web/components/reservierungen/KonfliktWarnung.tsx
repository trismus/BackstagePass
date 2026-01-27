interface KonfliktWarnungProps {
  message: string
  items: string[]
}

export function KonfliktWarnung({ message, items }: KonfliktWarnungProps) {
  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
      <div className="flex items-start gap-2">
        <svg
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-orange-800">{message}</p>
          <ul className="mt-1 list-inside list-disc text-sm text-orange-700">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
