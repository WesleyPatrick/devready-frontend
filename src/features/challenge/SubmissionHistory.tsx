import { RetryAlert } from '@/components/RetryAlert'
import { Loading, Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useGetChallengeSubmissionsQuery } from './api'
import { STATUS_TONES } from './status'
import { VerdictIcon } from './SubmissionResult'
import { challengeTexts } from './texts'
import type { SubmissionSummary } from './types'

const t = challengeTexts.history

export function SubmissionHistory({
  slug,
  onOpen,
}: {
  slug: string
  onOpen: (summary: SubmissionSummary) => void
}) {
  const { data, error, isFetching, refetch } = useGetChallengeSubmissionsQuery(slug)
  if (!data) {
    return error ? (
      <RetryAlert message={t.error} retrying={isFetching} onRetry={() => void refetch()} />
    ) : (
      <Loading label={t.loading} className="space-y-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-11" />
        ))}
      </Loading>
    )
  }
  if (data.length === 0) return <p className="text-sm text-muted-foreground">{t.empty}</p>
  return (
    <ul role="list" aria-label={t.label} className="m-0 list-none space-y-2 p-0">
      {data.map((s) => {
        const status = t.status[s.status]
        const language = challengeTexts.languages[s.language]
        const when = formatRelative(s.createdAt)
        return (
          <li
            key={s.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted px-3 py-2 text-sm"
          >
            <VerdictIcon status={s.status} />
            <span className={cn('font-medium', STATUS_TONES[s.status])}>{status}</span>
            <span className="text-xs text-muted-foreground">
              {t.meta(language, s.passedCount, s.totalCount, when)}
            </span>
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => onOpen(s)}>
              {t.open}
              <span className="sr-only">{t.openTarget(status, language, when)}</span>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
