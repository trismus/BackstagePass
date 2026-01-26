import type { HTMLAttributes, ReactNode } from 'react'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info'
  children: ReactNode
}

const variantStyles = {
  success: 'bg-success-50 border-success-200 text-success-700',
  error: 'bg-error-50 border-error-200 text-error-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
  info: 'bg-info-50 border-info-200 text-info-700',
}

const iconPaths = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

export function Alert({
  variant = 'info',
  children,
  className = '',
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-md border p-4 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <svg
        className="h-5 w-5 flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[variant]} />
      </svg>
      <div className="text-sm">{children}</div>
    </div>
  )
}
