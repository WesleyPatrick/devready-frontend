import { skipToken } from '@reduxjs/toolkit/query'
import { RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGetCareerProfileQuery } from '@/features/career/api'
import { cannons } from '@/lib/motion/celebrate'
import { getProblem } from '@/lib/problem'
import {
  challengeApi,
  useGetSubmissionQuery,
  useLazyGetSubmissionCodeQuery,
  useRunCodeMutation,
  useSubmitCodeMutation,
} from './api'
import { CodeEditor } from './CodeEditor'
import { ConfirmDialog } from './ConfirmDialog'
import { ActionBar, ConsolePanel, type ConsoleTab } from './ConsolePanel'
import { clearDraft, codesFor, saveDraft } from './drafts'
import { initialLanguage, saveLastLanguage } from './language'
import { LanguageSelect } from './LanguageSelect'
import { submissionPollMs } from './polling'
import { StatementPanel } from './StatementPanel'
import { isFinal, verdictText } from './status'
import { SubmissionResult, Waiting } from './SubmissionResult'
import { challengeTexts } from './texts'
import type {
  Challenge,
  ChallengeLanguage,
  Submission,
  SubmissionKind,
  SubmissionSummary,
} from './types'
import { useIsDesktop } from './useIsDesktop'

const t = challengeTexts

type MobileTab = 'statement' | 'code' | 'result'
type Pending = { kind: 'reset' } | { kind: 'open'; summary: SubmissionSummary } | null

function noticeFor(error: unknown) {
  const problem = getProblem(error)
  if (problem?.status === 429) return t.console.rateLimited
  if (problem?.status === 409) return problem.detail
  if (problem?.status === 422) {
    return problem.fieldErrors.sourceCode ?? problem.fieldErrors.language ?? problem.detail
  }
  return t.console.requestError
}

function useCelebration(submission: Submission | undefined) {
  const celebrated = useRef<string | null>(null)
  useEffect(() => {
    if (submission?.kind !== 'SUBMIT' || submission.status !== 'PASSED') return
    if (celebrated.current === submission.id) return
    celebrated.current = submission.id
    void cannons()
  }, [submission])
}

export function ChallengeWorkspace({ challenge }: { challenge: Challenge }) {
  const { slug } = challenge
  const { data: profile } = useGetCareerProfileQuery()
  const isDesktop = useIsDesktop()
  const [language, setLanguage] = useState(() =>
    initialLanguage(
      challenge.languages.map((l) => l.language),
      profile?.stack.slug,
    ),
  )
  const [codes, setCodes] = useState(() => codesFor(challenge))
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('cases')
  const [mobileTab, setMobileTab] = useState<MobileTab>('code')
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [openFailed, setOpenFailed] = useState(false)
  const [runCode, runState] = useRunCodeMutation()
  const [submitCode, submitState] = useSubmitCodeMutation()
  const [loadCode, loadState] = useLazyGetSubmissionCodeQuery()

  const { currentData: known } = challengeApi.endpoints.getSubmission.useQueryState(
    submissionId ?? skipToken,
  )
  const waiting = submissionId !== null && (!known || !isFinal(known.status))
  const { currentData: submission } = useGetSubmissionQuery(submissionId ?? skipToken, {
    pollingInterval: waiting ? submissionPollMs() : 0,
  })
  const sending = runState.isLoading || submitState.isLoading
  const busy = sending || waiting
  useCelebration(submission)

  function changeLanguage(next: ChallengeLanguage) {
    setLanguage(next)
    saveLastLanguage(next)
  }

  function changeCode(next: string) {
    setCodes((current) => ({ ...current, [language]: next }))
    saveDraft(slug, language, next)
  }

  async function execute(kind: SubmissionKind) {
    if (busy) return
    setNotice(null)
    setSubmissionId(null)
    setConsoleTab('result')
    setMobileTab('result')
    const body = { slug, language, sourceCode: codes[language] }
    try {
      const ticket = await (kind === 'RUN' ? runCode(body) : submitCode(body)).unwrap()
      setSubmissionId(ticket.id)
    } catch (error) {
      setNotice(noticeFor(error))
    }
  }

  function cancelPending() {
    setPending(null)
    setOpenFailed(false)
  }

  async function confirmPending() {
    if (!pending) return
    if (pending.kind === 'reset') {
      const starter = challenge.languages.find((l) => l.language === language)?.starterCode ?? ''
      setCodes((current) => ({ ...current, [language]: starter }))
      clearDraft(slug, language)
      cancelPending()
      return
    }
    try {
      const loaded = await loadCode(pending.summary.id).unwrap()
      setCodes((current) => ({ ...current, [loaded.language]: loaded.sourceCode }))
      saveDraft(slug, loaded.language, loaded.sourceCode)
      changeLanguage(loaded.language)
      setMobileTab('code')
      cancelPending()
    } catch {
      setOpenFailed(true)
    }
  }

  let result: ReactNode
  if (notice) {
    result = (
      <Alert>
        <AlertDescription>{notice}</AlertDescription>
      </Alert>
    )
  } else if (submission && isFinal(submission.status)) {
    result = (
      <SubmissionResult
        key={submission.id}
        submission={submission}
        timeLimitMs={challenge.limits.timeLimitMs}
      />
    )
  } else if (sending || submissionId) {
    result = <Waiting status={submission?.status === 'RUNNING' ? 'RUNNING' : 'QUEUED'} />
  } else {
    result = <p className="text-sm text-muted-foreground">{t.console.idle}</p>
  }
  const announcement = notice
    ? ''
    : submission
      ? verdictText(submission)
      : sending || submissionId
        ? t.result.QUEUED
        : ''

  const languageName = t.languages[pending?.kind === 'open' ? pending.summary.language : language]
  const statement = (
    <StatementPanel
      challenge={challenge}
      onOpenSubmission={(summary) => setPending({ kind: 'open', summary })}
    />
  )
  const editorArea = (
    <>
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
          onClick={() => setPending({ kind: 'reset' })}
        >
          <RotateCcw aria-hidden />
          <span className="max-[359px]:sr-only">{t.toolbar.reset}</span>
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          value={codes[language]}
          language={language}
          modelPath={`${slug}/${language}`}
          label={t.editor.label}
          onChange={changeCode}
          onRun={() => void execute('RUN')}
        />
      </div>
    </>
  )
  const consoleArea = (
    <ConsolePanel
      challenge={challenge}
      tab={consoleTab}
      onTabChange={setConsoleTab}
      result={result}
    />
  )
  const actions = (
    <ActionBar
      busy={busy}
      onRun={() => void execute('RUN')}
      onSubmit={() => void execute('SUBMIT')}
    />
  )

  return (
    <>
      {isDesktop ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 p-3">
          {statement}
          <div className="grid min-h-0 grid-rows-[minmax(0,3fr)_minmax(0,2fr)] gap-3">
            <section
              aria-label={t.editor.label}
              className="flex min-h-0 flex-col overflow-hidden rounded-lg bg-surface"
            >
              {editorArea}
            </section>
            <section
              aria-label={t.console.label}
              className="flex min-h-0 flex-col rounded-lg bg-surface"
            >
              {consoleArea}
              {actions}
            </section>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <Tabs
            value={mobileTab}
            onValueChange={(value) => setMobileTab(value as MobileTab)}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <TabsList
              variant="line"
              aria-label={t.page.areas}
              className="w-full shrink-0 justify-start border-b bg-surface px-3"
            >
              <TabsTrigger value="statement">{t.page.mobileTabs.statement}</TabsTrigger>
              <TabsTrigger value="code">{t.page.mobileTabs.code}</TabsTrigger>
              <TabsTrigger value="result">{t.page.mobileTabs.result}</TabsTrigger>
            </TabsList>
            <TabsContent
              forceMount
              value="statement"
              hidden={mobileTab !== 'statement'}
              className="min-h-0 p-3"
            >
              {statement}
            </TabsContent>
            <TabsContent
              forceMount
              value="code"
              hidden={mobileTab !== 'code'}
              className="flex min-h-0 flex-col bg-surface"
            >
              {editorArea}
            </TabsContent>
            <TabsContent
              forceMount
              value="result"
              hidden={mobileTab !== 'result'}
              className="flex min-h-0 flex-col bg-surface"
            >
              {consoleArea}
            </TabsContent>
          </Tabs>
          <div className="shrink-0 bg-surface">{actions}</div>
        </div>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === 'open' ? t.confirm.openTitle : t.confirm.resetTitle}
        body={
          pending?.kind === 'open'
            ? t.confirm.openBody(languageName)
            : t.confirm.resetBody(languageName)
        }
        action={pending?.kind === 'open' ? t.confirm.openAction : t.confirm.resetAction}
        busy={loadState.isFetching}
        error={openFailed ? t.history.openError : null}
        onConfirm={() => void confirmPending()}
        onCancel={cancelPending}
      />
    </>
  )
}
