'use client'

/**
 * Circular Progress Widget
 * Shows percentage-based metrics in a circular chart
 */

interface CircularProgressProps {
  /** Current value */
  value: number
  /** Maximum value (for percentage calculation) */
  max: number
  /** Title above the circle */
  title: string
  /** Optional subtitle below the percentage */
  subtitle?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Color theme */
  color?: 'primary' | 'success' | 'warning' | 'error'
}

export function CircularProgress({
  value,
  max,
  title,
  subtitle,
  size = 'md',
  color = 'primary',
}: CircularProgressProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0

  const sizes = {
    sm: { diameter: 80, strokeWidth: 8, fontSize: 'text-xl' },
    md: { diameter: 120, strokeWidth: 10, fontSize: 'text-3xl' },
    lg: { diameter: 160, strokeWidth: 12, fontSize: 'text-4xl' },
  }

  const colors = {
    primary: 'stroke-primary-600',
    success: 'stroke-green-600',
    warning: 'stroke-amber-600',
    error: 'stroke-red-600',
  }

  const bgColors = {
    primary: 'stroke-primary-100',
    success: 'stroke-green-100',
    warning: 'stroke-amber-100',
    error: 'stroke-red-100',
  }

  const { diameter, strokeWidth, fontSize } = sizes[size]
  const radius = (diameter - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-sm font-medium text-neutral-600">{title}</p>
      <div className="relative" style={{ width: diameter, height: diameter }}>
        <svg width={diameter} height={diameter} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={bgColors[color]}
          />
          {/* Progress circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={`${colors[color]} transition-all duration-700 ease-out`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className={`${fontSize} font-bold text-neutral-900`}>
              {percentage}%
            </span>
          </div>
        </div>
      </div>
      {subtitle && (
        <p className="mt-3 text-xs text-neutral-500">{subtitle}</p>
      )}
    </div>
  )
}
