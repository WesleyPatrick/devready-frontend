import { Clock, Coffee, Play } from 'lucide-react'
import { useState } from 'react'
import { CompetencyIcon } from '@/components/CompetencyIcon'
import { DifficultyLabel } from '@/components/DifficultyLabel'
import { LevelTag } from '@/components/LevelTag'
import { Panel } from '@/components/Panel'
import { QuestionText } from '@/components/QuestionText'
import { StatusIcon } from '@/components/StatusIcon'
import { Button } from '@/components/ui/button'
import { QuestionDialog } from '@/features/questions/QuestionDialog'
import { useGetDailyQuestionQuery } from '@/features/questions/api'
import { trackTexts } from './texts'
import { PanelSkeleton } from '@/components/Skeleton'

const t = trackTexts.daily

export function DailyQuestionPanel() {
  const { data: question, isError } = useGetDailyQuestionQuery()
  const [open, setOpen] = useState(false)
  if (isError && !question) return null
  if (!question) {
    return <PanelSkeleton label={t.loading} lines={3} />
  }

  const answered = question.status === 'SOLVED'
  const attempted = question.status === 'ATTEMPTED'

  return (
    <Panel title={t.title} icon={Coffee} iconClassName="text-brand">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {question.competency && (
          <span className="inline-flex items-center gap-1.5">
            <CompetencyIcon category={question.competency.category} />
            {question.competency.name}
          </span>
        )}
        <DifficultyLabel difficulty={question.difficulty} />
        {question.level !== 'JUNIOR' && <LevelTag level={question.level} labelled />}
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {t.minutes(question.estimatedMinutes)}
        </span>
      </div>
      <p className="mt-2 font-semibold">
        <QuestionText text={question.title} inline />
      </p>
      <div className="mt-3 flex items-center gap-2">
        {(answered || attempted) && (
          <>
            <StatusIcon status={question.status} />
            <span className="text-sm">{answered ? t.answered : t.attempted}</span>
          </>
        )}
        <Button
          variant={answered ? 'ghost' : 'default'}
          size={answered ? 'sm' : 'default'}
          className={answered ? 'ml-auto' : undefined}
          onClick={() => setOpen(true)}
        >
          {answered ? (
            t.review
          ) : (
            <>
              <Play aria-hidden />
              {t.answer(question.xp)}
            </>
          )}
        </Button>
      </div>
      <QuestionDialog slug={open ? question.slug : null} onClose={() => setOpen(false)} />
    </Panel>
  )
}
