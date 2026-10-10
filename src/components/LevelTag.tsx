import { appTexts } from '@/app/texts'
import type { Level } from '@/lib/learning'
import { cn } from '@/lib/utils'

type Props = {
  level: Level
  labelled?: boolean
  className?: string
}

export function LevelTag({ level, labelled = false, className }: Props) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-md border border-input px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase',
        className,
      )}
    >
      {labelled && <span className="sr-only">{appTexts.levelPrefix}</span>}
      {appTexts.levels[level]}
    </span>
  )
}
