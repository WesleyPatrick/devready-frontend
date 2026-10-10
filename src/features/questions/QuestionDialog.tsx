import { useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { CircleCheck, CircleX, Clock, X, Zap } from 'lucide-react'
import { CompetencyIcon } from '@/components/CompetencyIcon'
import { DifficultyLabel } from '@/components/DifficultyLabel'
import { QuestionText } from '@/components/QuestionText'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { sessionPath } from '@/app/paths'
import { openSessionIdOf } from '@/features/session/errors'
import { cannons } from '@/lib/motion/celebrate'
import { useRegisterOverlay } from '@/lib/motion/overlays'
import { prefersReducedMotion } from '@/lib/motion/reducedMotion'
import { cn } from '@/lib/utils'
import { AnswerOption } from './AnswerOption'
import { useAnswerQuestionMutation, useGetQuestionQuery } from './api'
import { questionsTexts } from './texts'
import type { AnswerResult } from './types'
import { Skeleton } from '@/components/Skeleton'
import { Sparks } from '@/components/Sparks'

const t = questionsTexts.dialog

function QuestionBody({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data: question, isError, error } = useGetQuestionQuery(slug)
  const [answerQuestion, { isLoading: sending, isError: answerFailed, error: answerError }] =
    useAnswerQuestionMutation()
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const groupName = useId()

  const examSession = openSessionIdOf(error) ?? openSessionIdOf(answerError)
  if (examSession) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t.inExam}</DialogTitle>
          <DialogDescription>{t.inExamBody}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <Link to={sessionPath(examSession)}>{t.continueExam}</Link>
          </Button>
        </DialogFooter>
      </>
    )
  }

  if (!question) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className={isError ? undefined : 'sr-only'}>
            {isError ? t.error : t.loading}
          </DialogTitle>
        </DialogHeader>
        {!isError && (
          <div aria-hidden className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5" />
            <Skeleton className="h-3.5 w-5/6" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        )}
      </>
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!selected || sending || result) return
    try {
      const answer = await answerQuestion({ slug, optionId: selected }).unwrap()
      setResult(answer)
      if (answer.correct) void cannons()
    } catch {}
  }

  const stateOf = (optionId: string) => {
    if (!result) return null
    if (optionId === result.correctOptionId) return 'correct'
    return optionId === selected ? 'wrong' : null
  }

  const outcome = result
    ? result.correct
      ? 'animate-hop'
      : 'animate-glow-hard rounded-lg'
    : undefined
  return (
    <div
      data-slot="question-body"
      className={cn('-m-2 grid gap-4 p-2', outcome, 'motion-reduce:animate-none')}
    >
      <DialogHeader>
        <DialogTitle>
          <QuestionText inline text={question.title} />
        </DialogTitle>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {question.competency && (
            <span className="flex items-center gap-1.5">
              <CompetencyIcon category={question.competency.category} />
              {question.competency.name}
            </span>
          )}
          <DifficultyLabel difficulty={question.difficulty} />
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {t.minutes(question.estimatedMinutes)}
          </span>
          <span className="flex items-center gap-1 text-medium">
            <Zap className="size-3.5" aria-hidden />
            {t.xp(question.xp)}
          </span>
        </div>
      </DialogHeader>
      {question.status === 'SOLVED' && !result && (
        <p className="text-sm text-muted-foreground">{t.alreadySolved}</p>
      )}
      <QuestionText text={question.statement} />
      <form onSubmit={submit} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="sr-only">{t.options}</legend>
          {question.options.map((option) => (
            <AnswerOption
              key={option.id}
              name={groupName}
              id={option.id}
              text={option.text}
              checked={selected === option.id}
              disabled={result !== null}
              answered={result !== null}
              state={stateOf(option.id)}
              late={result !== null && !result.correct && stateOf(option.id) === 'correct'}
              onChange={() => setSelected(option.id)}
            />
          ))}
        </fieldset>
        <div aria-live="polite">
          {result && (
            <div className="space-y-3">
              <div className="relative flex items-center gap-2">
                {result.correct ? (
                  <CircleCheck
                    className="size-5 shrink-0 animate-pop text-easy motion-reduce:animate-none [&>*]:animate-draw [&>*]:[stroke-dasharray:64] motion-reduce:[&>*]:animate-none"
                    aria-hidden
                  />
                ) : (
                  <CircleX
                    className="size-5 shrink-0 animate-pop text-hard motion-reduce:animate-none"
                    aria-hidden
                  />
                )}
                <p className={cn('font-semibold', result.correct ? 'text-easy' : 'text-hard')}>
                  {result.correct ? t.correct(result.xpGained) : t.wrong}
                </p>
                {result.correct && result.xpGained > 0 && !prefersReducedMotion() && (
                  <span
                    data-slot="xp-float"
                    aria-hidden
                    className="pointer-events-none absolute -top-2 left-1/2 inline-flex animate-float-up items-center gap-1 font-mono text-lg font-bold text-medium"
                  >
                    <span className="relative inline-flex">
                      <Zap className="size-4" />
                      <Sparks />
                    </span>
                    +{result.xpGained} XP
                  </span>
                )}
              </div>
              <div className="space-y-1 rounded-md bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">{t.explanation}</p>
                <QuestionText text={result.explanation} />
              </div>
            </div>
          )}
        </div>
        {answerFailed && <Alert variant="destructive">{t.answerError}</Alert>}
        <DialogFooter>
          {result ? (
            <Button type="button" onClick={onClose}>
              {t.close}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!selected}
              aria-disabled={sending || undefined}
              className="aria-disabled:cursor-progress"
            >
              {sending ? t.answering : t.answer}
            </Button>
          )}
        </DialogFooter>
      </form>
    </div>
  )
}

type DialogProps = {
  slug: string | null
  onClose: () => void
  fallbackFocus?: () => void
}

export function QuestionDialog({ slug, onClose, fallbackFocus }: DialogProps) {
  const opener = useRef<HTMLElement | null>(null)
  const open = slug !== null
  useRegisterOverlay(open)
  useLayoutEffect(() => {
    if (open && !opener.current && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement
    }
  }, [open])
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          if (opener.current?.isConnected) opener.current.focus()
          else fallbackFocus?.()
          opener.current = null
        }}
      >
        <DialogClose asChild>
          <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2">
            <X aria-hidden />
            <span className="sr-only">{t.close}</span>
          </Button>
        </DialogClose>
        {slug && <QuestionBody key={slug} slug={slug} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
