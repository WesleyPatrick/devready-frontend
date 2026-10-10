import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { Link } from 'react-router'
import { BookOpen, ExternalLink, Lock, SquareCode, X } from 'lucide-react'
import { challengePath } from '@/app/paths'
import { CompanyMonogram } from '@/components/CompanyMonogram'
import { CompetencyIcon } from '@/components/CompetencyIcon'
import { DifficultyLabel } from '@/components/DifficultyLabel'
import { LevelTag } from '@/components/LevelTag'
import { FrequencyBar } from '@/components/FrequencyBar'
import { QuestionText } from '@/components/QuestionText'
import { RetryAlert } from '@/components/RetryAlert'
import { StatusIcon } from '@/components/StatusIcon'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { QuestionDialog } from '@/features/questions/QuestionDialog'
import { StartLessonButton } from '@/features/session/StartLessonButton'
import { companiesOf, type CompanyRef } from '@/lib/learning'
import { rowAction } from '@/lib/rowAction'
import { useRegisterOverlay } from '@/lib/motion/overlays'
import { cn } from '@/lib/utils'
import { useGetCompetencyQuery } from './api'
import { RequirementTag } from './RequirementTag'
import { trackTexts } from './texts'
import type { CompetencyDetail } from './types'
import { Skeleton } from '@/components/Skeleton'

const t = trackTexts.sheet

type Props = {
  slug: string | null
  companies: CompanyRef[]
  onClose: () => void
}

type SheetQuestion = CompetencyDetail['questions'][number]

function QuestionRow({ question }: { question: SheetQuestion }) {
  return (
    <>
      <StatusIcon status={question.status} />
      <span className="min-w-0 flex-1">
        <QuestionText inline text={question.title} />
      </span>
      {question.level !== 'JUNIOR' && <LevelTag level={question.level} labelled />}
      <DifficultyLabel difficulty={question.difficulty} />
    </>
  )
}

type SheetChallenge = CompetencyDetail['challenges'][number]

function ChallengeRow({ challenge }: { challenge: SheetChallenge }) {
  return (
    <>
      <StatusIcon status={challenge.status} />
      <SquareCode className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block">{challenge.title}</span>
        <span className="block text-xs font-normal text-muted-foreground">
          {challenge.languages.map((l) => t.languages[l]).join(' · ')}
        </span>
      </span>
      {challenge.level !== 'JUNIOR' && <LevelTag level={challenge.level} labelled />}
      <DifficultyLabel difficulty={challenge.difficulty} />
    </>
  )
}

function SheetSection({
  title,
  emptyText,
  isEmpty,
  children,
}: {
  title: string
  emptyText: string
  isEmpty: boolean
  children: (labelledBy: string) => ReactNode
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <h3 id={id} className="text-sm font-semibold">
        {title}
      </h3>
      {isEmpty ? <p className="text-sm text-muted-foreground">{emptyText}</p> : children(id)}
    </div>
  )
}

export function CompetencySheet({ slug, companies, onClose }: Props) {
  const result = useGetCompetencyQuery(slug ?? skipToken)
  const data = slug === null ? result.data : result.currentData
  const { error, isFetching, refetch } = result
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  useRegisterOverlay(slug !== null)

  useLayoutEffect(() => {
    if (slug !== null && !opener.current && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement
    }
  }, [slug])

  const askedBy = data ? companiesOf(data.askedBy, companies) : []
  const locked = data?.status === 'LOCKED'

  return (
    <>
      <Sheet open={slug !== null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full overflow-y-auto data-[side=right]:w-full sm:data-[side=right]:max-w-md motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none motion-reduce:transition-none"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            opener.current?.focus()
            opener.current = null
          }}
        >
          {data ? (
            <>
              <SheetHeader className="pr-10">
                <SheetTitle className="flex items-center gap-2">
                  <CompetencyIcon category={data.category} className="text-muted-foreground" />
                  {data.name}
                </SheetTitle>
                <SheetDescription>{data.description}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-4">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <DifficultyLabel difficulty={data.difficulty} />
                  <RequirementTag requirement={data.requirement} />
                  <FrequencyBar jobs={data.frequency.jobs} total={data.frequency.total} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xs font-medium text-muted-foreground">{t.askedBy}</h3>
                  <ul
                    role="list"
                    className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-sm"
                  >
                    {askedBy.map((company) => (
                      <li key={company.slug}>
                        <CompanyMonogram company={company} withName />
                      </li>
                    ))}
                  </ul>
                </div>
                {data.lockedReason && (
                  <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
                    <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <p>
                      <strong className="font-medium">{t.locked}</strong>
                      <span className="block text-muted-foreground">{data.lockedReason}</span>
                    </p>
                  </div>
                )}
                <SheetSection
                  title={t.materials}
                  emptyText={t.noMaterials}
                  isEmpty={data.materials.length === 0}
                >
                  {(labelledBy) => (
                    <ul
                      role="list"
                      aria-labelledby={labelledBy}
                      className="m-0 list-none space-y-2 p-0"
                    >
                      {data.materials.map((material) => (
                        <li key={material.url} className="relative flex gap-2 text-sm">
                          <BookOpen
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <a
                              href={material.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-sm font-medium break-words text-brand underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                              {material.title}
                              <ExternalLink
                                className="ml-1 inline size-3.5 align-[-2px]"
                                aria-hidden
                              />
                              <span className="sr-only"> {t.newTab}</span>
                            </a>
                            <p className="text-xs text-muted-foreground">
                              {[
                                t.materialType[material.type],
                                t.materialLanguage[material.language],
                                material.free ? t.free : t.paid,
                              ].join(' · ')}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </SheetSection>
                <SheetSection
                  title={t.questions}
                  emptyText={t.noQuestions}
                  isEmpty={data.questions.length === 0}
                >
                  {(labelledBy) => (
                    <>
                      {locked && (
                        <p className="text-sm text-muted-foreground">{t.lockedQuestions}</p>
                      )}
                      {!locked && (
                        <StartLessonButton
                          competency={data.slug}
                          questionCount={data.questions.length}
                        />
                      )}
                      <ul
                        role="list"
                        aria-labelledby={labelledBy}
                        className="m-0 list-none space-y-1 p-0"
                      >
                        {data.questions.map((question) => (
                          <li key={question.slug}>
                            {locked ? (
                              <div className="flex w-full items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                                <QuestionRow question={question} />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setOpenQuestion(question.slug)}
                                className={cn(
                                  rowAction,
                                  'flex w-full items-center gap-2 px-2 py-2 text-sm',
                                )}
                              >
                                <QuestionRow question={question} />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </SheetSection>
                <SheetSection
                  title={t.challenges}
                  emptyText={t.noChallenges}
                  isEmpty={data.challenges.length === 0}
                >
                  {(labelledBy) => (
                    <>
                      <p className={cn('text-muted-foreground', locked ? 'text-sm' : 'text-xs')}>
                        {locked ? t.lockedChallenges : t.challengesNote}
                      </p>
                      <ul
                        role="list"
                        aria-labelledby={labelledBy}
                        className="m-0 list-none space-y-1 p-0"
                      >
                        {data.challenges.map((challenge) => (
                          <li key={challenge.slug}>
                            {locked ? (
                              <div className="flex w-full items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                                <ChallengeRow challenge={challenge} />
                              </div>
                            ) : (
                              <Link
                                to={challengePath(challenge.slug)}
                                className={cn(
                                  rowAction,
                                  'flex w-full items-center gap-2 px-2 py-2 text-sm',
                                )}
                              >
                                <ChallengeRow challenge={challenge} />
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </SheetSection>
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="pr-10">
                <SheetTitle className={error ? undefined : 'sr-only'}>
                  {error ? t.error : t.loading}
                </SheetTitle>
                {!error && <SheetDescription className="sr-only">{t.loading}</SheetDescription>}
              </SheetHeader>
              {!error && (
                <div aria-hidden className="space-y-3 px-4">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-3.5" />
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="mt-4 h-24" />
                </div>
              )}
              {error && (
                <div className="px-4">
                  <RetryAlert
                    message={t.error}
                    retrying={isFetching}
                    onRetry={() => void refetch()}
                  />
                </div>
              )}
            </>
          )}
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" className="absolute top-3 right-3">
              <X aria-hidden />
              <span className="sr-only">{t.close}</span>
            </Button>
          </SheetClose>
        </SheetContent>
      </Sheet>
      <QuestionDialog slug={openQuestion} onClose={() => setOpenQuestion(null)} />
    </>
  )
}
