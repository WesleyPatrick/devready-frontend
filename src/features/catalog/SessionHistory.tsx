import { History } from 'lucide-react'
import { Link } from 'react-router'
import { sessionPath, sessionResultPath } from '@/app/paths'
import { Panel } from '@/components/Panel'
import { RetryAlert } from '@/components/RetryAlert'
import { Loading, Skeleton } from '@/components/Skeleton'
import { useGetSessionsQuery } from '@/features/session/api'
import { sessionTexts } from '@/features/session/texts'
import type { SessionSummary } from '@/features/session/types'
import { formatPercent, formatRelative } from '@/lib/format'
import { catalogTexts } from './texts'

const t = sessionTexts.history

const SESSION_LINK_LABELS: Partial<Record<SessionSummary['status'], string>> = {
  IN_PROGRESS: t.open,
  SUBMITTED: t.follow,
  FAILED: t.details,
}

function titleOf(item: SessionSummary) {
  return item.format === 'SIMULATION'
    ? t.simulation(item.area.name, catalogTexts.levels[item.level])
    : t.lesson(item.competency?.name ?? item.area.name)
}

export function SessionHistory() {
  const { data, error, isFetching, refetch } = useGetSessionsQuery()
  return (
    <Panel title={t.title} icon={History} iconClassName="text-muted-foreground">
      {!data && !error && (
        <Loading label={t.loading} className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </Loading>
      )}
      {error && !data && (
        <RetryAlert message={t.error} retrying={isFetching} onRetry={() => void refetch()} />
      )}
      {data?.length === 0 && <p className="text-sm text-muted-foreground">{t.empty}</p>}
      {data && data.length > 0 && (
        <ul role="list" className="m-0 list-none divide-y p-0">
          {data.map((item) => {
            const title = titleOf(item)
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 font-medium">{title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(item.finishedAt ?? item.startedAt)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {sessionTexts.status[item.status]}
                </span>
                {item.finalScore !== null && (
                  <span className="font-mono text-xs">
                    {t.score(formatPercent(item.finalScore))}
                  </span>
                )}
                {item.xpAwarded > 0 && (
                  <span className="font-mono text-xs text-medium">{t.xp(item.xpAwarded)}</span>
                )}
                {item.status === 'COMPLETED' && (
                  <Link
                    to={sessionResultPath(item.id)}
                    className="font-medium text-brand underline-offset-4 hover:underline"
                  >
                    {t.result}
                    <span className="sr-only">{t.resultOf(title)}</span>
                  </Link>
                )}
                {item.status in SESSION_LINK_LABELS && (
                  <Link
                    to={sessionPath(item.id)}
                    className="font-medium text-brand underline-offset-4 hover:underline"
                  >
                    {SESSION_LINK_LABELS[item.status]}
                    {item.status !== 'IN_PROGRESS' && (
                      <span className="sr-only">{t.resultOf(title)}</span>
                    )}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
