import { CircleCheck, CircleDashed, Contrast, Lock, type LucideIcon } from 'lucide-react'
import { appTexts } from '@/app/texts'
import type { CompetencyStatus, QuestionStatus } from '@/lib/learning'
import { cn } from '@/lib/utils'

type Status = CompetencyStatus | QuestionStatus

const ICONS: Record<Status, LucideIcon> = {
  DONE: CircleCheck,
  SOLVED: CircleCheck,
  IN_PROGRESS: Contrast,
  ATTEMPTED: Contrast,
  NOT_STARTED: CircleDashed,
  LOCKED: Lock,
}

const TONES: Record<Status, string> = {
  DONE: 'text-easy',
  SOLVED: 'text-easy',
  IN_PROGRESS: 'text-medium',
  ATTEMPTED: 'text-medium',
  NOT_STARTED: 'text-muted-foreground',
  LOCKED: 'text-muted-foreground',
}

const LABELS: Record<Status, string> = { ...appTexts.questionStatus, ...appTexts.competencyStatus }

export function StatusIcon({ status }: { status: Status }) {
  const Icon = ICONS[status]
  return (
    <span className="inline-flex">
      <Icon className={cn('size-4', TONES[status])} aria-hidden />
      <span className="sr-only">{LABELS[status]}</span>
    </span>
  )
}
