import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Segment = { value: number; className: string }
type Props = {
  segments: Segment[]
  total: number
  label: string
  size?: number
  stroke?: number
  children?: ReactNode
}

export function ProgressRing({ segments, total, label, size = 92, stroke = 8, children }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const safeTotal = Math.max(total, 1)
  const done = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0)
  const arcs = segments.map((segment, index) => ({
    segment,
    length: (Math.max(0, segment.value) / safeTotal) * circumference,
    start: segments
      .slice(0, index)
      .reduce(
        (sum, previous) => sum + (Math.max(0, previous.value) / safeTotal) * circumference,
        0,
      ),
  }))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(done, total)}
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        {arcs.map(({ segment, length, start }, index) => {
          if (length === 0) return null
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-start}
              className={cn(
                'transition-[stroke-dasharray] duration-500 motion-reduce:transition-none',
                segment.className,
              )}
            />
          )
        })}
      </svg>
      {children && (
        <div className="absolute text-center leading-tight" aria-hidden>
          {children}
        </div>
      )}
    </div>
  )
}
