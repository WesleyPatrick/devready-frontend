import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Column<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

type Props<T> = {
  caption: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  rowClassName?: (row: T) => string | undefined
  empty?: ReactNode
  animateRows?: boolean
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  rowClassName,
  empty,
  animateRows,
}: Props<T>) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-2 py-2 text-left text-xs font-medium text-muted-foreground',
                  column.headerClassName,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-2 py-8 text-center text-muted-foreground">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  'odd:bg-surface-alt',
                  animateRows && 'animate-rise motion-reduce:animate-none',
                  rowClassName?.(row),
                )}
                style={animateRows ? { animationDelay: `${index * 70}ms` } : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-2 py-2.5 align-middle', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
