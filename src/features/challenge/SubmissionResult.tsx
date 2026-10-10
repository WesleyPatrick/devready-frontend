import { Zap } from 'lucide-react'
import { createElement, useState } from 'react'
import { Sparks } from '@/components/Sparks'
import { prefersReducedMotion } from '@/lib/motion/reducedMotion'
import { cn } from '@/lib/utils'
import { CaseValues } from './CaseValues'
import { CASE_ICONS, CASE_TONES, isFinal, STATUS_ICONS, STATUS_TONES } from './status'
import { challengeTexts } from './texts'
import type { CaseResult, CaseStatus, Submission, SubmissionStatus } from './types'

const t = challengeTexts.result

export function VerdictIcon({
  status,
  className,
}: {
  status: SubmissionStatus
  className?: string
}) {
  return createElement(STATUS_ICONS[status], {
    className: cn(
      'size-4 shrink-0',
      STATUS_TONES[status],
      !isFinal(status) && 'animate-spin motion-reduce:animate-none',
      className,
    ),
    'aria-hidden': true,
  })
}

function CaseIcon({ status }: { status: CaseStatus }) {
  return createElement(CASE_ICONS[status], {
    className: cn('size-3.5 shrink-0', CASE_TONES[status]),
    'aria-hidden': true,
  })
}

export function Waiting({ status }: { status: 'QUEUED' | 'RUNNING' }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <VerdictIcon status={status} />
      {t[status]}
    </p>
  )
}

function Output({ text }: { text: string }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
      {text}
    </pre>
  )
}

function Cases({ cases }: { cases: CaseResult[] }) {
  const visible = cases.filter((c) => c.visible)
  const firstWrong = visible.find((c) => c.status !== 'PASSED') ?? visible[0]
  const [picked, setPicked] = useState(firstWrong?.position)
  const shown = visible.find((c) => c.position === picked)
  return (
    <div className="space-y-3">
      <ul role="list" aria-label={t.caseList} className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {cases.map((c) => (
          <li key={c.position}>
            {c.visible ? (
              <button
                type="button"
                aria-pressed={c.position === picked}
                onClick={() => setPicked(c.position)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  c.position === picked ? 'border-foreground/40 bg-muted' : 'hover:bg-muted',
                )}
              >
                <CaseIcon status={c.status} />
                {t.caseLabel(c.position + 1)}
                <span className="sr-only">: {t.caseStatus[c.status]}</span>
              </button>
            ) : (
              <span className="inline-flex items-center rounded-full border px-2 py-1">
                <CaseIcon status={c.status} />
                <span className="sr-only">
                  {t.hiddenCase(c.position + 1, t.caseStatus[c.status])}
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
      {shown?.args && (
        <div className="rounded-md bg-muted p-3">
          <CaseValues
            args={shown.args}
            expected={shown.expected}
            actual={shown.actual}
            error={shown.error}
          />
        </div>
      )}
    </div>
  )
}

export function SubmissionResult({
  submission,
  timeLimitMs,
}: {
  submission: Submission
  timeLimitMs: number
}) {
  const { status, kind, passedCount, totalCount, cases, xpGained } = submission
  if (status === 'QUEUED' || status === 'RUNNING') return <Waiting status={status} />
  const accepted = status === 'PASSED' && kind === 'SUBMIT'
  const ranVisible = status === 'PASSED' && kind === 'RUN'
  return (
    <div className="space-y-3">
      <div className="relative flex flex-wrap items-center gap-x-2 gap-y-1">
        <VerdictIcon
          status={status}
          className={cn('size-5', status === 'PASSED' && 'animate-pop motion-reduce:animate-none')}
        />
        <p className={cn('font-semibold', STATUS_TONES[status])}>
          {ranVisible ? t.runPassed : t[status]}
        </p>
        {cases.length > 0 && (
          <span className="text-sm text-muted-foreground">{t.cases(passedCount, totalCount)}</span>
        )}
        {accepted && xpGained > 0 && !prefersReducedMotion() && (
          <span
            data-slot="xp-float"
            aria-hidden
            className="pointer-events-none absolute -top-2 left-1/2 inline-flex animate-float-up items-center gap-1 font-mono text-lg font-bold text-medium motion-reduce:animate-none"
          >
            <span className="relative inline-flex">
              <Zap className="size-4" />
              <Sparks />
            </span>
            {t.xp(xpGained)}
          </span>
        )}
      </div>
      {accepted && xpGained === 0 && (
        <p className="text-sm text-muted-foreground">{t.alreadySolved}</p>
      )}
      {ranVisible && <p className="text-sm text-muted-foreground">{t.runHint}</p>}
      {status === 'TIME_LIMIT' && (
        <p className="text-sm text-muted-foreground">{t.timeLimit(timeLimitMs)}</p>
      )}
      {status === 'COMPILE_ERROR' && submission.compileOutput && (
        <Output text={submission.compileOutput} />
      )}
      {status === 'RUNTIME_ERROR' && submission.errorMessage && (
        <Output text={submission.errorMessage} />
      )}
      {cases.length > 0 && <Cases cases={cases} />}
    </div>
  )
}
