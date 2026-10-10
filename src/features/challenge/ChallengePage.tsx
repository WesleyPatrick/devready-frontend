import { SearchX, Timer } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { paths, sessionPath } from '@/app/paths'
import { EmptyState } from '@/components/EmptyState'
import { RetryAlert } from '@/components/RetryAlert'
import { Loading, Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { openSessionIdOf } from '@/features/session/errors'
import { getProblem } from '@/lib/problem'
import { useGetChallengeQuery } from './api'
import { ChallengeHeader } from './ChallengeHeader'
import { ChallengeWorkspace } from './ChallengeWorkspace'
import { challengeTexts } from './texts'

const t = challengeTexts.page

export function ChallengePage() {
  const { slug = '' } = useParams()
  const { data, error, isFetching, refetch } = useGetChallengeQuery(slug)

  if (!data) {
    const examSession = openSessionIdOf(error)
    if (examSession) {
      return (
        <div className="mx-auto w-full max-w-xl p-4">
          <EmptyState
            icon={Timer}
            title={t.inExam}
            headingLevel="h1"
            action={
              <Button asChild>
                <Link to={sessionPath(examSession)}>{t.continueExam}</Link>
              </Button>
            }
          >
            {t.inExamBody}
          </EmptyState>
        </div>
      )
    }
    if (getProblem(error)?.status === 404) {
      return (
        <div className="mx-auto w-full max-w-xl p-4">
          <EmptyState
            icon={SearchX}
            title={t.notFound}
            headingLevel="h1"
            action={
              <Button asChild variant="outline">
                <Link to={paths.questions}>{t.backToQuestions}</Link>
              </Button>
            }
          >
            {t.notFoundBody}
          </EmptyState>
        </div>
      )
    }
    if (error) {
      return (
        <div className="p-4">
          <RetryAlert message={t.error} retrying={isFetching} onRetry={() => void refetch()} />
        </div>
      )
    }
    return (
      <Loading label={t.loading} className="space-y-3 p-4">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-[60vh] rounded-lg" />
      </Loading>
    )
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChallengeHeader challenge={data} />
      <ChallengeWorkspace key={data.slug} challenge={data} />
    </div>
  )
}
