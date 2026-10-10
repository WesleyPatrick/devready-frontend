import { cn } from '@/lib/utils'
import { trackTexts } from './texts'
import type { Requirement } from './types'

export function RequirementTag({
  requirement,
  id,
  className,
}: {
  requirement: Requirement
  id?: string
  className?: string
}) {
  return (
    <span
      id={id}
      className={cn(
        'shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] leading-none',
        requirement === 'obrigatoria' ? 'font-medium text-foreground' : 'text-muted-foreground',
        className,
      )}
    >
      {trackTexts.requirement[requirement]}
    </span>
  )
}
