import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  icon: LucideIcon
  title: string
  headingLevel?: 'h1' | 'h2'
  children?: ReactNode
  action?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  headingLevel: Heading = 'h2',
  children,
  action,
}: Props) {
  return (
    <section className="flex flex-col items-center gap-2 rounded-lg bg-surface px-6 py-10 text-center">
      <Icon className="size-5 text-muted-foreground" aria-hidden />
      <Heading className="text-base font-semibold">{title}</Heading>
      {children && <p className="max-w-md text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </section>
  )
}
