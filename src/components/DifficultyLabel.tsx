import { appTexts } from '@/app/texts'
import { DIFFICULTY_TONE, type Difficulty } from '@/lib/learning'
import { cn } from '@/lib/utils'

export function DifficultyLabel({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={cn('font-medium', DIFFICULTY_TONE[difficulty])}>
      {appTexts.difficulty[difficulty]}
    </span>
  )
}
