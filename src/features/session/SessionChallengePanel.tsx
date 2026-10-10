import { skipToken } from '@reduxjs/toolkit/query'
import { RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { CaseValues } from '@/features/challenge/CaseValues'
import { CodeEditor } from '@/features/challenge/CodeEditor'
import { ConfirmDialog } from '@/features/challenge/ConfirmDialog'
import { ActionBar, ConsolePanel, type ConsoleTab } from '@/features/challenge/ConsolePanel'
import { initialLanguage, saveLastLanguage } from '@/features/challenge/language'
import { LanguageSelect } from '@/features/challenge/LanguageSelect'
import { submissionPollMs } from '@/features/challenge/polling'
import { isFinal } from '@/features/challenge/status'
import { SubmissionResult, Waiting } from '@/features/challenge/SubmissionResult'
import { challengeTexts } from '@/features/challenge/texts'
import type { ChallengeLanguage, SubmissionKind } from '@/features/challenge/types'
import { useIsDesktop } from '@/features/challenge/useIsDesktop'
import { useGetCareerProfileQuery } from '@/features/career/api'
import { QuestionText } from '@/components/QuestionText'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getProblem } from '@/lib/problem'
import { cn } from '@/lib/utils'
import {
  sessionApi,
  useGetSessionSubmissionQuery,
  useRunSessionCodeMutation,
  useSubmitSessionCodeMutation,
} from './api'
import { clearSessionDraft, saveSessionDraft, sessionCodesFor } from './drafts'
import { SealedResult } from './SealedResult'
import { sessionTexts } from './texts'
import type { Session, SessionChallenge } from './types'

const ct = challengeTexts
const t = sessionTexts.challenge

function noticeFor(error: unknown) {
  const problem = getProblem(error)
  if (problem?.status === 429) return ct.console.rateLimited
  if (problem?.status === 422) {
    return problem.fieldErrors.sourceCode ?? problem.fieldErrors.language ?? problem.detail
  }
  return ct.console.requestError
}

export function SessionChallengePanel({
  session,
  challenge,
}: {
  session: Session
  challenge: SessionChallenge
}) {
  const { data: profile } = useGetCareerProfileQuery()
  const isDesktop = useIsDesktop()
  const [language, setLanguage] = useState<ChallengeLanguage>(() =>
    initialLanguage(
      challenge.languages.map((l) => l.language),
      profile?.stack.slug,
    ),
  )
  const [codes, setCodes] = useState(() => sessionCodesFor(session.id, challenge))
  const [submissionId, setSubmissionId] = useState<string | null>(challenge.lastSubmissionId)
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>(
    challenge.lastSubmissionId ? 'result' : 'cases',
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [runCode, runState] = useRunSessionCodeMutation()
  const [submitCode, submitState] = useSubmitSessionCodeMutation()

  const { currentData: known } = sessionApi.endpoints.getSessionSubmission.useQueryState(
    submissionId ?? skipToken,
  )
  const waiting = submissionId !== null && (!known || !isFinal(known.status))
  const { currentData: submission } = useGetSessionSubmissionQuery(submissionId ?? skipToken, {
    pollingInterval: waiting ? submissionPollMs() : 0,
  })
  const sending = runState.isLoading || submitState.isLoading
  const busy = sending || waiting
  const open = session.status === 'IN_PROGRESS'
  const noneLeft = challenge.submissionsLeft === 0

  function changeLanguage(next: ChallengeLanguage) {
    setLanguage(next)
    saveLastLanguage(next)
  }

  function changeCode(next: string) {
    setCodes((current) => ({ ...current, [language]: next }))
    saveSessionDraft(session.id, challenge.slug, language, next)
  }

  async function execute(kind: SubmissionKind) {
    if (!open) return
    if (kind === 'SUBMIT' && noneLeft) {
      setNotice(t.noneLeft)
      setConsoleTab('result')
      return
    }
    if (busy) return
    setNotice(null)
    setSubmissionId(null)
    setConsoleTab('result')
    const body = {
      sessionId: session.id,
      position: challenge.position,
      language,
      sourceCode: codes[language],
    }
    try {
      const ticket = await (kind === 'RUN' ? runCode(body) : submitCode(body)).unwrap()
      setSubmissionId(ticket.id)
    } catch (error) {
      setNotice(noticeFor(error))
    }
  }

  function reset() {
    const starter = challenge.languages.find((l) => l.language === language)?.starterCode ?? ''
    setCodes((current) => ({ ...current, [language]: starter }))
    clearSessionDraft(session.id, challenge.slug, language)
    setResetting(false)
  }

  let result: ReactNode
  if (notice) {
    result = (
      <Alert>
        <AlertDescription>{notice}</AlertDescription>
      </Alert>
    )
  } else if (submission && isFinal(submission.status)) {
    result = submission.sealed ? (
      <SealedResult submission={submission} />
    ) : (
      <SubmissionResult
        key={submission.id}
        submission={submission}
        timeLimitMs={challenge.limits.timeLimitMs}
      />
    )
  } else if (sending || submissionId) {
    result = <Waiting status={submission?.status === 'RUNNING' ? 'RUNNING' : 'QUEUED'} />
  } else {
    result = <p className="text-sm text-muted-foreground">{ct.console.idle}</p>
  }

  const statement = (
    <section
      aria-label={t.statement}
      className="min-h-0 space-y-4 overflow-y-auto rounded-lg bg-surface p-4"
    >
      <h2 className="text-lg font-semibold">{challenge.title}</h2>
      <QuestionText text={challenge.statement} />
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{t.examples}</h3>
        {challenge.visibleCases.map((c) => (
          <div key={c.position} className="rounded-md bg-muted p-3">
            <CaseValues args={c.args} expected={c.expected} />
          </div>
        ))}
      </div>
    </section>
  )

  return (
    <div
      className={cn(
        'min-h-0 flex-1 gap-3 p-3',
        isDesktop ? 'grid h-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : 'flex flex-col',
      )}
    >
      {statement}
      <div
        className={cn(
          'grid min-h-0 gap-3',
          isDesktop ? 'grid-rows-[minmax(0,3fr)_minmax(0,2fr)]' : 'grid-rows-[20rem_auto]',
        )}
      >
        <section
          aria-label={ct.editor.label}
          className="flex min-h-0 flex-col overflow-hidden rounded-lg bg-surface"
        >
          <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
            <LanguageSelect
              languages={challenge.languages}
              value={language}
              onChange={changeLanguage}
            />
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setResetting(true)}
            >
              <RotateCcw aria-hidden />
              <span className="max-[359px]:sr-only">{ct.toolbar.reset}</span>
            </Button>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor
              value={codes[language]}
              language={language}
              modelPath={`${session.id}/${challenge.slug}/${language}`}
              label={ct.editor.label}
              onChange={changeCode}
              onRun={() => void execute('RUN')}
            />
          </div>
        </section>
        <section
          aria-label={ct.console.label}
          className="flex min-h-0 flex-col rounded-lg bg-surface"
        >
          <ConsolePanel
            challenge={challenge}
            tab={consoleTab}
            onTabChange={setConsoleTab}
            result={result}
          />
          <ActionBar
            busy={busy || !open}
            onRun={() => void execute('RUN')}
            onSubmit={() => void execute('SUBMIT')}
            note={t.left(
              challenge.submissionsLeft,
              challenge.submissionsUsed + challenge.submissionsLeft,
            )}
            submitBlocked={noneLeft}
          />
        </section>
      </div>
      <ConfirmDialog
        open={resetting}
        title={ct.confirm.resetTitle}
        body={ct.confirm.resetBody(ct.languages[language])}
        action={ct.confirm.resetAction}
        onConfirm={reset}
        onCancel={() => setResetting(false)}
      />
    </div>
  )
}
