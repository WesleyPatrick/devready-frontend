import { useId, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title?: ReactNode
  icon?: LucideIcon
  iconClassName?: string
  actions?: ReactNode
  headingLevel?: 'h2' | 'h3'
  className?: string
  children: ReactNode
}

export function Panel({
  title,
  icon: Icon,
  iconClassName,
  actions,
  headingLevel: Heading = 'h2',
  className,
  children,
}: Props) {
  const id = useId()
  return (
    <section
      aria-labelledby={title ? id : undefined}
      className={cn('rounded-lg bg-surface p-4', className)}
    >
      {title && (
        <div className="mb-3 flex items-center gap-2">
          {Icon && <Icon className={cn('size-4 shrink-0', iconClassName)} aria-hidden />}
          <Heading id={id} className="text-sm font-semibold">
            {title}
          </Heading>
          {actions && (
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
