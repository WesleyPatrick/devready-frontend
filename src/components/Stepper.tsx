import { Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { appTexts } from '@/app/texts'

type Props = {
  steps: readonly string[]
  current: number
  label: string
  icons?: readonly LucideIcon[]
}

export function Stepper({ steps, current, label, icons }: Props) {
  return (
    <ol role="list" aria-label={label} className="flex items-center gap-2">
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        const StepIcon = icons?.[index]
        return (
          <li
            key={step}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex min-w-0 items-center gap-2 text-sm',
              index < steps.length - 1 ? 'flex-auto' : 'flex-initial',
            )}
          >
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                done && 'border-easy bg-easy text-primary-foreground',
                active && 'border-primary bg-primary text-primary-foreground',
                !done && !active && 'border-input text-muted-foreground',
              )}
              aria-hidden
            >
              {done ? (
                <Check className="size-3.5" />
              ) : StepIcon ? (
                <StepIcon className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            <span className={cn('truncate', active ? 'font-medium' : 'text-muted-foreground')}>
              {step}
              {done && <span className="sr-only">{appTexts.stepDone}</span>}
            </span>
            {index < steps.length - 1 && (
              <span className="h-px min-w-3 flex-1 bg-border" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}
