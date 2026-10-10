import { useCallback, useState } from 'react'
import { SearchX } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { paths, sessionResultPath } from '@/app/paths'
import { EmptyState } from '@/components/EmptyState'
import { RetryAlert } from '@/components/RetryAlert'
import { PageSkeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/features/challenge/ConfirmDialog'
import { submissionPollMs } from '@/features/challenge/polling'
import { useIsDesktop } from '@/features/challenge/useIsDesktop'
import { getProblem } from '@/lib/problem'
import { sessionApi, useFinishSessionMutation, useGetSessionQuery } from './api'
import { readCurrentItem, saveCurrentItem } from './currentItem'
import { GradingNotice } from './GradingNotice'
import { ItemMenu } from './ItemMenu'
import { ItemNav } from './ItemNav'
import { itemsOf, sameItem } from './items'
import { SessionChallengePanel } from './SessionChallengePanel'
import { SessionHeader } from './SessionHeader'
import { SessionQuestionPanel } from './SessionQuestionPanel'
import { itemSelected, selectCurrentItem, type ItemKey } from './slice'
import { sessionTexts } from './texts'

const t = sessionTexts

export default function SessionPage() {
  const { id = '' } = useParams()
  const dispatch = useAppDispatch()
  const isDesktop = useIsDesktop()
  const { data: known, error: knownError } = sessionApi.endpoints.getSession.useQueryState(id)
  const gone = [404, 422].includes(getProblem(knownError)?.status ?? 0)
  const grading = known?.status === 'SUBMITTED' && !gone
  const {
    data: cached,
    error,
    isFetching,
    refetch,
  } = useGetSessionQuery(id, { pollingInterval: grading ? submissionPollMs() : 0 })
  const session = getProblem(error)?.status === 404 ? undefined : cached
  const inMemory = useAppSelector((state) => selectCurrentItem(state, id))
  const stored = inMemory ?? readCurrentItem(id)
  const [finish, finishState] = useFinishSessionMutation()
  const [confirming, setConfirming] = useState(false)
  const expire = useCallback(() => {
    void finish(id)
  }, [finish, id])

  if (!session) {
    if (getProblem(error)?.status === 404) {
      return (
        <div className="mx-auto w-full max-w-xl p-4">
          <EmptyState
            icon={SearchX}
            title={t.page.notFound}
            headingLevel="h1"
            action={
              <Button asChild variant="outline">
                <Link to={paths.newSimulation}>{t.page.back}</Link>
              </Button>
            }
          >
            {t.page.notFoundBody}
          </EmptyState>
        </div>
      )
    }
    if (error) {
      return (
        <div className="p-4">
          <RetryAlert message={t.page.error} retrying={isFetching} onRetry={() => void refetch()} />
        </div>
      )
    }
    return (
      <div className="p-4">
        <PageSkeleton label={t.page.loading} />
      </div>
    )
  }

  if (session.format === 'SIMULATION' && session.status === 'COMPLETED') {
    return <Navigate to={sessionResultPath(session.id)} replace />
  }
  if (session.status === 'FAILED') {
    return (
      <div className="mx-auto w-full max-w-xl p-4">
        <EmptyState
          icon={SearchX}
          title={t.page.failed}
          headingLevel="h1"
          action={
            <Button asChild variant="outline">
              <Link to={paths.newSimulation}>{t.page.back}</Link>
            </Button>
          }
        >
          {t.page.failedBody}
        </EmptyState>
      </div>
    )
  }

  const items = itemsOf(session)
  const current: ItemKey =
    stored && items.some((item) => sameItem(item.key, stored)) ? stored : items[0].key
  const index = items.findIndex((item) => sameItem(item.key, current))
  const select = (item: ItemKey) => {
    saveCurrentItem(session.id, item)
    dispatch(itemSelected({ sessionId: session.id, item }))
  }
  const unansweredQuestions = session.questions.filter((q) => q.chosenOptionId === null).length
  const untouchedChallenges = session.challenges.filter((c) => c.submissionsUsed === 0).length

  async function confirmFinish() {
    if (finishState.isLoading) return
    try {
      const { status } = await finish(id).unwrap()
      dispatch(
        sessionApi.util.updateQueryData('getSession', id, (draft) => {
          draft.status = status
        }),
      )
      setConfirming(false)
    } catch {}
  }

  const question =
    current.kind === 'question'
      ? session.questions.find((q) => q.position === current.position)
      : undefined
  const challenge =
    current.kind === 'challenge'
      ? session.challenges.find((c) => c.position === current.position)
      : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SessionHeader
        session={session}
        onFinish={() => setConfirming(true)}
        onExpire={expire}
        itemMenu={
          !isDesktop && session.status !== 'SUBMITTED' ? (
            <ItemMenu items={items} current={current} onSelect={select} />
          ) : undefined
        }
      />
      {error && (
        <div className="shrink-0 px-4 pt-2">
          <RetryAlert message={t.page.error} retrying={isFetching} onRetry={() => void refetch()} />
        </div>
      )}
      {session.status === 'SUBMITTED' ? (
        <GradingNotice />
      ) : (
        <div className="flex min-h-0 flex-1">
          {isDesktop && (
            <ItemNav
              items={items}
              current={current}
              compact={current.kind === 'challenge'}
              onSelect={select}
            />
          )}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            {question && (
              <div className="mx-auto w-full max-w-3xl p-4">
                <SessionQuestionPanel
                  key={`q-${question.position}`}
                  session={session}
                  question={question}
                  onPrevious={index > 0 ? () => select(items[index - 1].key) : null}
                  onNext={index < items.length - 1 ? () => select(items[index + 1].key) : null}
                />
              </div>
            )}
            {challenge && (
              <SessionChallengePanel
                key={`c-${challenge.position}`}
                session={session}
                challenge={challenge}
              />
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title={t.banner.confirmTitle}
        body={t.banner.confirmBody(unansweredQuestions, untouchedChallenges)}
        action={t.banner.confirm}
        busy={finishState.isLoading}
        error={finishState.isError ? t.banner.error : null}
        onConfirm={() => void confirmFinish()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
