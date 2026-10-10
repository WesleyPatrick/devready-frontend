import { SearchX } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { paths, sessionPath } from '@/app/paths'
import { EmptyState } from '@/components/EmptyState'
import { RetryAlert } from '@/components/RetryAlert'
import { PageSkeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { catalogTexts } from '@/features/catalog/texts'
import { getProblem } from '@/lib/problem'
import { useGetSessionQuery, useGetSessionResultQuery } from './api'
import { CorrectionList } from './CorrectionList'
import { FeedbackPanel } from './FeedbackPanel'
import { ScoreSummary } from './ScoreSummary'
import { sessionTexts } from './texts'

const t = sessionTexts.result

export default function SessionResultPage() {
  const { id = '' } = useParams()
  const result = useGetSessionResultQuery(id)
  const session = useGetSessionQuery(id)

  if (!result.data || !session.data) {
    if (getProblem(result.error)?.status === 404) {
      return (
        <div className="mx-auto w-full max-w-xl">
          <EmptyState
            icon={SearchX}
            title={t.notReady}
            headingLevel="h1"
            action={
              <Button asChild variant="outline">
                <Link to={sessionPath(id)}>{t.backToSession}</Link>
              </Button>
            }
          >
            {t.notReadyBody}
          </EmptyState>
        </div>
      )
    }
    if (result.error || session.error) {
      return (
        <RetryAlert
          message={t.error}
          retrying={result.isFetching || session.isFetching}
          onRetry={() => {
            void result.refetch()
            void session.refetch()
          }}
        />
      )
    }
    return <PageSkeleton label={t.loading} />
  }

  const s = session.data
  const subtitle =
    s.format === 'SIMULATION'
      ? `${s.area.name} · ${catalogTexts.levels[s.level]}`
      : (s.competency?.name ?? s.area.name)
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t.title[s.format]}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild variant="outline">
          <Link to={paths.newSimulation}>{t.newSimulation}</Link>
        </Button>
      </div>
      <ScoreSummary session={s} result={result.data} />
      <FeedbackPanel competencies={result.data.competencies} />
      <CorrectionList session={s} result={result.data} />
    </section>
  )
}
