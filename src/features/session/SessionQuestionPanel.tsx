import { useId, useState } from 'react'
import { DifficultyLabel } from '@/components/DifficultyLabel'
import { QuestionText } from '@/components/QuestionText'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AnswerOption } from '@/features/questions/AnswerOption'
import { cannons } from '@/lib/motion/celebrate'
import { cn } from '@/lib/utils'
import { useAnswerSessionQuestionMutation } from './api'
import { sessionTexts } from './texts'
import type { Session, SessionQuestion } from './types'

const t = sessionTexts

export function SessionQuestionPanel({
  session,
  question,
  onPrevious,
  onNext,
}: {
  session: Session
  question: SessionQuestion
  onPrevious: (() => void) | null
  onNext: (() => void) | null
}) {
  const [answer, { isLoading, isError }] = useAnswerSessionQuestionMutation()
  const [xp, setXp] = useState<number | null>(null)
  const groupName = useId()
  const titleId = useId()
  const lesson = session.format === 'LESSON'
  const revealed = question.correct !== undefined
  const locked = session.status !== 'IN_PROGRESS' || (lesson && question.chosenOptionId !== null)

  async function choose(optionId: string) {
    if (locked || isLoading) return
    try {
      const result = await answer({
        sessionId: session.id,
        position: question.position,
        optionId,
      }).unwrap()
      if (lesson) {
        setXp(result.xpGained)
        if (result.correct) void cannons()
      }
    } catch {}
  }

  const stateOf = (id: string) => {
    if (!revealed) return null
    if (id === question.correctOptionId) return 'correct'
    return id === question.chosenOptionId ? 'wrong' : null
  }

  return (
    <article aria-labelledby={titleId} className="space-y-4">
      <header className="space-y-1">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {t.items.question(question.position)}
          <DifficultyLabel difficulty={question.difficulty} />
        </p>
        <h2 id={titleId} className="text-lg font-semibold">
          <QuestionText inline text={question.title} />
        </h2>
      </header>
      <QuestionText text={question.statement} />
      <fieldset className="space-y-2">
        <legend className="sr-only">{t.question.options}</legend>
        {question.options.map((option) => (
          <AnswerOption
            key={option.id}
            name={groupName}
            id={option.id}
            text={option.text}
            checked={question.chosenOptionId === option.id}
            disabled={locked}
            answered={revealed}
            state={stateOf(option.id)}
            late={revealed && !question.correct && stateOf(option.id) === 'correct'}
            onChange={() => void choose(option.id)}
          />
        ))}
      </fieldset>
      <div aria-live="polite" className="space-y-2">
        {revealed && (
          <>
            <p className={cn('font-semibold', question.correct ? 'text-easy' : 'text-hard')}>
              {question.correct ? t.question.correct : t.question.wrong}
              {xp ? ` ${t.question.xp(xp)}` : ''}
            </p>
            <div className="space-y-1 rounded-md bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground">{t.question.explanation}</p>
              <QuestionText text={question.explanation ?? ''} />
            </div>
          </>
        )}
        {!lesson && question.chosenOptionId !== null && (
          <p className="text-sm text-muted-foreground">
            {isLoading ? t.question.saving : t.question.saved} {t.question.hidden}
          </p>
        )}
      </div>
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{t.question.saveError}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          aria-disabled={onPrevious === null || undefined}
          onClick={() => onPrevious?.()}
        >
          {t.question.previous}
        </Button>
        <Button aria-disabled={onNext === null || undefined} onClick={() => onNext?.()}>
          {t.question.next}
        </Button>
      </div>
    </article>
  )
}
