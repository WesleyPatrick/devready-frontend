import { appTexts } from '@/app/texts'
import { DIFFICULTY_FILL, type Difficulty } from '@/lib/learning'
import { cn } from '@/lib/utils'
import { DifficultyLabel } from './DifficultyLabel'

type Props = { difficulty: Difficulty; done: number; total: number }

export function DifficultyBar({ difficulty, done, total }: Props) {
  const width = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="grid grid-cols-[3.5rem_1fr_2.75rem] items-center gap-2 text-xs">
      <DifficultyLabel difficulty={difficulty} />
      <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span
          className={cn('block h-full rounded-full', DIFFICULTY_FILL[difficulty])}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="text-right font-mono tabular-nums text-muted-foreground" aria-hidden>
        {done}/{total}
      </span>
      <span className="sr-only">{appTexts.doneOf(done, total)}</span>
    </div>
  )
}
