/**
 * Metric Card Widget
 * Shows a large number with title and optional subtitle (like "$15,890 Prepayments")
 */

interface MetricCardProps {
  /** Large value to display */
  value: string | number
  /** Title above the value */
  title: string
  /** Optional subtitle or description */
  subtitle?: string
  /** Optional icon */
  icon?: React.ReactNode
  /** Optional trend indicator */
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  /** Color theme */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
}

export function MetricCard({
  value,
  title,
  subtitle,
  icon,
  trend,
  variant = 'default',
}: MetricCardProps) {
  const variants = {
    default: 'bg-white border-neutral-200',
    primary: 'bg-primary-50 border-primary-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
  }

  const valueColors = {
    default: 'text-neutral-900',
    primary: 'text-primary-900',
    success: 'text-green-900',
    warning: 'text-amber-900',
    error: 'text-red-900',
  }

  return (
    <div
      className={`rounded-xl border p-6 transition-shadow hover:shadow-md ${variants[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${valueColors[variant]}`}>
              {value}
            </span>
            {trend && (
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  trend.direction === 'up'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {trend.direction === 'up' ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                )}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-white/50 p-3 text-neutral-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
