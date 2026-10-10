import { useEffect, useState } from 'react'
import { Route } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { paths } from '@/app/paths'
import { EmptyState } from '@/components/EmptyState'
import { RetryAlert } from '@/components/RetryAlert'
import { Button } from '@/components/ui/button'
import { useGetCareerProfileQuery } from '@/features/career/api'
import { careerTexts } from '@/features/career/texts'
import { formatList } from '@/lib/format'
import { AchievementsPanel } from './AchievementsPanel'
import { CompetencySheet } from './CompetencySheet'
import { CompetencyTable } from './CompetencyTable'
import { DailyQuestionPanel } from './DailyQuestionPanel'
import { GoalBar } from './GoalBar'
import { PlanCard } from './PlanCard'
import { StreakPanel } from './StreakPanel'
import { useGetTrackQuery } from './api'
import { trackTexts } from './texts'
import { Loading, Skeleton, TableSkeleton } from '@/components/Skeleton'

const t = trackTexts

export function TrackPage() {
  const { data: profile } = useGetCareerProfileQuery()
  const track = useGetTrackQuery()
  const [params, setParams] = useSearchParams()
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const location = useLocation()
  const [cascade, setCascade] = useState(
    () => (location.state as { celebrate?: unknown } | null)?.celebrate === true,
  )
  useEffect(() => {
    if (!cascade) return
    const timer = setTimeout(() => setCascade(false), 2000)
    return () => clearTimeout(timer)
  }, [cascade])
  const query = params.get('q') ?? ''
  const companies = profile?.companies.map(({ slug, name }) => ({ slug, name })) ?? []
  const data = track.data
  const area = profile ? careerTexts.areas[profile.stack.area] : ''

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-4">
          {profile && <GoalBar profile={profile} />}
          {data ? (
            data.competencies.length === 0 ? (
              <EmptyState
                icon={Route}
                title={t.empty.title(area)}
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link to={`${paths.onboarding}?edit=1`}>{t.goal.edit}</Link>
                  </Button>
                }
              >
                {t.empty.body(formatList(data.plan.missingCompanies.map((c) => c.name)))}
              </EmptyState>
            ) : (
              <>
                {profile && <PlanCard plan={data.plan} profile={profile} />}
                <CompetencyTable
                  competencies={data.competencies}
                  companies={companies}
                  query={query}
                  onClearQuery={() =>
                    setParams((prev) => {
                      const next = new URLSearchParams(prev)
                      next.delete('q')
                      return next
                    })
                  }
                  onOpen={setOpenSlug}
                  cascade={cascade}
                />
              </>
            )
          ) : track.error ? (
            <RetryAlert
              message={t.error}
              retrying={track.isFetching}
              onRetry={() => void track.refetch()}
            />
          ) : (
            <Loading label={t.loading} className="space-y-4">
              <Skeleton className="h-36 rounded-lg" />
              <TableSkeleton rows={6} />
            </Loading>
          )}
        </div>
        <section aria-label={t.sidebar} className="space-y-4">
          <StreakPanel />
          <DailyQuestionPanel />
          <AchievementsPanel />
        </section>
      </div>
      <CompetencySheet slug={openSlug} companies={companies} onClose={() => setOpenSlug(null)} />
    </div>
  )
}
