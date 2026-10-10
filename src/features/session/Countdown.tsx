import { Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sessionTexts } from './texts'
import { formatClock, useCountdown } from './useCountdown'

const FIVE_MINUTES = 5 * 60_000

export function Countdown({ deadlineAt, onExpire }: { deadlineAt: string; onExpire: () => void }) {
  const remaining = useCountdown(deadlineAt, onExpire)
  if (remaining === null) return null
  const clock = formatClock(remaining)
  return (
    <span
      role="timer"
      aria-label={sessionTexts.header.timer(clock)}
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-sm tabular-nums',
        remaining < FIVE_MINUTES ? 'font-semibold text-hard' : 'text-muted-foreground',
      )}
    >
      <Timer className="size-4" aria-hidden />
      {clock}
    </span>
  )
}
