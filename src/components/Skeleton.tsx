import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn(
        'relative overflow-hidden rounded-md bg-muted',
        'after:absolute after:inset-0 after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-foreground/10 after:to-transparent motion-reduce:after:hidden',
        className,
      )}
      {...props}
    />
  )
}

export function Loading({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export function PageSkeleton({ label }: { label: string }) {
  return (
    <Loading label={label} className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </Loading>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-lg bg-surface p-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      ))}
    </div>
  )
}

export function PanelSkeleton({ label, lines = 3 }: { label: string; lines?: number }) {
  return (
    <Loading label={label} className="space-y-3 rounded-lg bg-surface p-4">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-3.5" />
      ))}
    </Loading>
  )
}
