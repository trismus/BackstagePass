'use client'

import { useState, useCallback, type ReactNode, type HTMLAttributes } from 'react'

// =============================================================================
// Types
// =============================================================================

export type SortDirection = 'asc' | 'desc' | null

export interface TableColumn<T> {
  /** Unique column key */
  key: string
  /** Column header text */
  header: string | ReactNode
  /** Column is sortable */
  sortable?: boolean
  /** Custom cell renderer */
  render?: (row: T, rowIndex: number) => ReactNode
  /** Column width (CSS value) */
  width?: string
  /** Align content */
  align?: 'left' | 'center' | 'right'
  /** Additional class names for cells */
  className?: string
}

export interface SortState {
  key: string
  direction: SortDirection
}

export interface TableProps<T> extends Omit<HTMLAttributes<HTMLTableElement>, 'children'> {
  /** Column definitions */
  columns: TableColumn<T>[]
  /** Table data */
  data: T[]
  /** Key extractor for rows */
  getRowKey?: (row: T, index: number) => string | number
  /** Current sort state */
  sort?: SortState
  /** Callback when sort changes */
  onSort?: (sort: SortState) => void
  /** Loading state */
  loading?: boolean
  /** Number of skeleton rows when loading */
  skeletonRows?: number
  /** Empty state content */
  emptyState?: ReactNode
  /** Enable row selection */
  selectable?: boolean
  /** Selected row keys */
  selectedKeys?: (string | number)[]
  /** Callback when selection changes */
  onSelectionChange?: (keys: (string | number)[]) => void
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void
  /** Highlight row on hover */
  hoverable?: boolean
  /** Striped rows */
  striped?: boolean
  /** Compact mode */
  compact?: boolean
  /** Additional class names */
  className?: string
}

// =============================================================================
// Skeleton Row Component
// =============================================================================

function SkeletonRow({ columns }: { columns: TableColumn<unknown>[] }) {
  return (
    <tr className="animate-pulse">
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <div className="h-4 rounded bg-neutral-200" style={{ width: col.width || '60%' }} />
        </td>
      ))}
    </tr>
  )
}

// =============================================================================
// Sortable Header Component
// =============================================================================

interface SortableHeaderProps {
  column: TableColumn<unknown>
  sort?: SortState
  onSort?: (sort: SortState) => void
  compact?: boolean
}

function SortableHeader({ column, sort, onSort, compact }: SortableHeaderProps) {
  const isSorted = sort?.key === column.key
  const direction = isSorted ? sort.direction : null

  const handleClick = () => {
    if (!column.sortable || !onSort) return

    let newDirection: SortDirection = 'asc'
    if (direction === 'asc') {
      newDirection = 'desc'
    } else if (direction === 'desc') {
      newDirection = null
    }

    onSort({ key: column.key, direction: newDirection })
  }

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[column.align || 'left']

  return (
    <th
      className={`
        ${compact ? 'px-3 py-2' : 'px-4 py-3'} font-semibold text-neutral-700
        ${alignClass}
        ${column.sortable ? 'cursor-pointer select-none hover:bg-neutral-100' : ''}
        ${column.className || ''}
      `}
      style={{ width: column.width }}
      onClick={column.sortable ? handleClick : undefined}
      aria-sort={
        isSorted
          ? direction === 'asc'
            ? 'ascending'
            : direction === 'desc'
              ? 'descending'
              : undefined
          : undefined
      }
    >
      <div className="flex items-center gap-1">
        <span>{column.header}</span>
        {column.sortable && (
          <span className="ml-1 inline-flex flex-col text-neutral-400">
            <svg
              className={`h-3 w-3 ${isSorted && direction === 'asc' ? 'text-primary-600' : ''}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 5l7 7H5l7-7z" />
            </svg>
            <svg
              className={`-mt-1 h-3 w-3 ${isSorted && direction === 'desc' ? 'text-primary-600' : ''}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 19l-7-7h14l-7 7z" />
            </svg>
          </span>
        )}
      </div>
    </th>
  )
}

// =============================================================================
// Table Component
// =============================================================================

export function Table<T>({
  columns,
  data,
  getRowKey,
  sort,
  onSort,
  loading = false,
  skeletonRows = 5,
  emptyState,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  onRowClick,
  hoverable = true,
  striped = false,
  compact = false,
  className = '',
  ...props
}: TableProps<T>) {
  const [localSelectedKeys, setLocalSelectedKeys] = useState<(string | number)[]>([])

  // Use controlled or uncontrolled selection
  const effectiveSelectedKeys = selectable
    ? onSelectionChange
      ? selectedKeys
      : localSelectedKeys
    : []

  const setSelectedKeys = useCallback(
    (keys: (string | number)[]) => {
      if (onSelectionChange) {
        onSelectionChange(keys)
      } else {
        setLocalSelectedKeys(keys)
      }
    },
    [onSelectionChange]
  )

  const getKey = (row: T, index: number): string | number => {
    if (getRowKey) return getRowKey(row, index)
    // Try common key properties
    const anyRow = row as Record<string, unknown>
    if ('id' in anyRow && anyRow.id !== undefined) return String(anyRow.id)
    if ('key' in anyRow && anyRow.key !== undefined) return String(anyRow.key)
    return index
  }

  const handleRowSelect = (key: string | number) => {
    if (effectiveSelectedKeys.includes(key)) {
      setSelectedKeys(effectiveSelectedKeys.filter((k) => k !== key))
    } else {
      setSelectedKeys([...effectiveSelectedKeys, key])
    }
  }

  const handleSelectAll = () => {
    if (effectiveSelectedKeys.length === data.length) {
      setSelectedKeys([])
    } else {
      setSelectedKeys(data.map((row, i) => getKey(row, i)))
    }
  }

  const isAllSelected = data.length > 0 && effectiveSelectedKeys.length === data.length
  const isIndeterminate = effectiveSelectedKeys.length > 0 && effectiveSelectedKeys.length < data.length

  const renderCell = (row: T, column: TableColumn<T>, rowIndex: number): ReactNode => {
    if (column.render) {
      return column.render(row, rowIndex)
    }
    // Default: try to access the property
    const anyRow = row as Record<string, unknown>
    if (column.key in anyRow) {
      const value = anyRow[column.key]
      if (value === null || value === undefined) return '-'
      return String(value)
    }
    return '-'
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-neutral-200" {...props}>
        {/* Header */}
        <thead className="bg-neutral-50">
          <tr>
            {selectable && (
              <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} w-10`}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  aria-label="Alle auswaehlen"
                />
              </th>
            )}
            {columns.map((column) => (
              <SortableHeader
                key={column.key}
                column={column as TableColumn<unknown>}
                sort={sort}
                onSort={onSort}
                compact={compact}
              />
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-neutral-100 bg-white">
          {loading ? (
            // Loading skeleton
            Array.from({ length: skeletonRows }).map((_, i) => (
              <SkeletonRow key={i} columns={columns as TableColumn<unknown>[]} />
            ))
          ) : data.length === 0 ? (
            // Empty state
            <tr>
              <td
                colSpan={selectable ? columns.length + 1 : columns.length}
                className="px-4 py-8 text-center"
              >
                {emptyState || (
                  <div className="text-neutral-500">
                    Keine Daten vorhanden
                  </div>
                )}
              </td>
            </tr>
          ) : (
            // Data rows
            data.map((row, rowIndex) => {
              const key = getKey(row, rowIndex)
              const isSelected = effectiveSelectedKeys.includes(key)

              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  className={`
                    transition-colors
                    ${hoverable && !loading ? 'hover:bg-neutral-50' : ''}
                    ${striped && rowIndex % 2 === 1 ? 'bg-neutral-25' : ''}
                    ${isSelected ? 'bg-primary-50' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {selectable && (
                    <td className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} w-10`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelect(key)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        aria-label={`Zeile ${rowIndex + 1} auswaehlen`}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const alignClass = {
                      left: 'text-left',
                      center: 'text-center',
                      right: 'text-right',
                    }[column.align || 'left']

                    return (
                      <td
                        key={column.key}
                        className={`
                          ${compact ? 'px-3 py-2' : 'px-4 py-3'} text-neutral-900
                          ${alignClass}
                          ${column.className || ''}
                        `}
                        style={{ width: column.width }}
                      >
                        {renderCell(row, column, rowIndex)}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// =============================================================================
// Export Types
// =============================================================================

export type { TableColumn as Column }
