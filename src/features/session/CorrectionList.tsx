import { createElement } from 'react'
import { CircleCheck, CircleDashed, CircleX } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { QuestionText } from '@/components/QuestionText'
import { useGetCareerProfileQuery } from '@/features/career/api'
import { visibleLevels } from '@/lib/learning'
import { cn } from '@/lib/utils'
import { OpenInEditor } from './OpenInEditor'
import { sessionTexts } from './texts'
import type { Session, SessionResult } from './types'

const t = sessionTexts.result

const MARKS = {
  correct: { icon: CircleCheck, tone: 'text-easy', label: t.correct },
  wrong: { icon: CircleX, tone: 'text-hard', label: t.wrong },
  unanswered: { icon: CircleDashed, tone: 'text-muted-foreground', label: t.unanswered },
} as const

function Mark({ kind }: { kind: keyof typeof MARKS }) {
  const mark = MARKS[kind]
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', mark.tone)}>
      {createElement(mark.icon, { className: 'size-4', 'aria-hidden': true })}
      {mark.label}
    </span>
  )
}

const summaryClass =
  'flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden'

export function CorrectionList({ session, result }: { session: Session; result: SessionResult }) {
  const { data: profile } = useGetCareerProfileQuery()
  const opensInPractice = visibleLevels(profile?.seniority ?? 'JUNIOR').includes(session.level)
  const optionText = (position: number, id: string | null) =>
    session.questions.find((q) => q.position === position)?.options.find((o) => o.id === id)?.text
  return (
    <Panel title={t.correction}>
      <ol role="list" className="m-0 list-none space-y-1 p-0">
        {result.questions.map((q, index) => {
          const kind = q.chosenOptionId === null ? 'unanswered' : q.correct ? 'correct' : 'wrong'
          return (
            <li key={`q-${q.position}`}>
              <details className="rounded-md">
                <summary className={summaryClass}>
                  <span className="min-w-0 flex-1">
                    {index + 1}. <QuestionText inline text={q.title} />
                  </span>
                  <Mark kind={kind} />
                </summary>
                <div className="space-y-3 px-3 pt-1 pb-3 text-sm">
                  {q.chosenOptionId !== null && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{t.yourAnswer}</p>
                      <QuestionText inline text={optionText(q.position, q.chosenOptionId) ?? ''} />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t.rightAnswer}</p>
                    <QuestionText inline text={optionText(q.position, q.correctOptionId) ?? ''} />
                  </div>
                  <div className="space-y-1 rounded-md bg-muted p-3">
                    <p className="text-xs font-medium text-muted-foreground">{t.explanation}</p>
                    <QuestionText text={q.explanation} />
                  </div>
                </div>
              </details>
            </li>
          )
        })}
        {result.challenges.map((c, index) => (
          <li key={`c-${c.position}`}>
            <details className="rounded-md">
              <summary className={summaryClass}>
                <span className="min-w-0 flex-1">
                  {result.questions.length + index + 1}. {c.title}
                </span>
                <Mark
                  kind={
                    c.bestSubmissionId === null
                      ? 'unanswered'
                      : c.passedCount === c.totalCount
                        ? 'correct'
                        : 'wrong'
                  }
                />
              </summary>
              <div className="flex flex-wrap items-center gap-3 px-3 pt-1 pb-3 text-sm">
                {c.bestSubmissionId ? (
                  <>
                    <p className="mr-auto">{t.best(c.passedCount, c.totalCount)}</p>
                    {opensInPractice ? (
                      <OpenInEditor slug={c.slug} submissionId={c.bestSubmissionId} />
                    ) : (
                      <p className="w-full text-muted-foreground">{t.aboveGoal}</p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">{t.noSubmission}</p>
                )}
              </div>
            </details>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
