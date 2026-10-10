import type { LucideIcon } from 'lucide-react'
import { prefersReducedMotion } from '@/lib/motion/reducedMotion'
import { cn } from '@/lib/utils'
import { Sparks } from './Sparks'

const TONES = { brand: 'text-brand', medium: 'text-medium', easy: 'text-easy' } as const
const EFFECTS = { blaze: 'animate-blaze', zap: 'animate-zap' } as const

type Props = {
  icon: LucideIcon
  value: string
  label: string
  tone: keyof typeof TONES
  effect?: keyof typeof EFFECTS
  pulse?: number
}

export function StatChip({ icon: Icon, value, label, tone, effect, pulse = 0 }: Props) {
  const moving = pulse > 0 && !prefersReducedMotion()
  return (
    <span
      title={label}
      className={cn(
        'inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums',
        TONES[tone],
      )}
    >
      <span
        key={`icon-${pulse}`}
        data-slot="stat-icon"
        className={cn(
          'relative inline-flex origin-[50%_85%]',
          moving && effect && EFFECTS[effect],
          'motion-reduce:animate-none',
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {moving && <Sparks />}
      </span>
      <span
        key={`value-${pulse}`}
        data-slot="stat-value"
        aria-hidden
        className={cn(moving && 'inline-block animate-pop motion-reduce:animate-none')}
      >
        {value}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
