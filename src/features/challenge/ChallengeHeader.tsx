import { ArrowLeft, Zap } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { CompetencyIcon } from '@/components/CompetencyIcon'
import { DifficultyLabel } from '@/components/DifficultyLabel'
import { StatusIcon } from '@/components/StatusIcon'
import { challengeTexts } from './texts'
import type { Challenge } from './types'

const t = challengeTexts.page

export function ChallengeHeader({ challenge }: { challenge: Challenge }) {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b bg-surface px-4 py-2">
      <Link
        to={paths.questions}
        className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t.back}
      </Link>
      <div className="flex min-w-0 items-center gap-2">
        <StatusIcon status={challenge.status} />
        <h1 className="truncate text-base font-semibold">{challenge.title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <DifficultyLabel difficulty={challenge.difficulty} />
        {challenge.competency && (
          <span className="flex items-center gap-1.5">
            <CompetencyIcon category={challenge.competency.category} />
            {challenge.competency.name}
          </span>
        )}
        <span className="flex items-center gap-1 text-medium">
          <Zap className="size-3.5" aria-hidden />
          {t.xp(challenge.xp)}
        </span>
      </div>
    </header>
  )
}
