'use client'

/**
 * Bar Chart Widget
 * Shows data as vertical bars (like in the screenshot)
 */

interface BarChartProps {
  /** Chart title */
  title: string
  /** Data points with label and value */
  data: Array<{ label: string; value: number }>
  /** Bar color */
  color?: 'primary' | 'success' | 'warning' | 'error'
  /** Height of chart area */
  height?: number
}

export function BarChart({
  title,
  data,
  color = 'primary',
  height = 200,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  }

  const hoverColors = {
    primary: 'hover:bg-primary-600',
    success: 'hover:bg-green-600',
    warning: 'hover:bg-amber-600',
    error: 'hover:bg-red-600',
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-neutral-700">{title}</h3>
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * height : 0
          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center justify-end gap-2"
            >
              {/* Bar */}
              <div
                className={`w-full rounded-t-lg ${colors[color]} ${hoverColors[color]} transition-all duration-300 ease-out`}
                style={{ height: `${barHeight}px` }}
                title={`${item.label}: ${item.value}`}
              />
              {/* Label */}
              <span className="text-xs font-medium text-neutral-600">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
