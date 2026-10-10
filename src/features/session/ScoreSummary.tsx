import { Target, Zap } from 'lucide-react'
import { formatPercent } from '@/lib/format'
import { sessionTexts } from './texts'
import type { Session, SessionResult } from './types'

const t = sessionTexts.result

export function ScoreSummary({ session, result }: { session: Session; result: SessionResult }) {
  const hits = result.questions.filter((q) => q.correct).length
  return (
    <section aria-label={t.summary} className="grid gap-3 sm:grid-cols-2">
      {result.finalScore !== null ? (
        <div className="rounded-lg bg-surface p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Target className="size-4" aria-hidden />
            {t.score}
          </p>
          <p className="font-mono text-4xl font-semibold">{formatPercent(result.finalScore)}</p>
          <p className="text-sm text-muted-foreground">{t.hits(hits, result.questions.length)}</p>
        </div>
      ) : (
        <div className="rounded-lg bg-surface p-4">
          <p className="font-mono text-2xl font-semibold">
            {t.hits(hits, result.questions.length)}
          </p>
        </div>
      )}
      {session.format === 'SIMULATION' && (
        <div className="rounded-lg bg-surface p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Zap className="size-4 text-medium" aria-hidden />
            {t.xpLabel}
          </p>
          <p className="font-mono text-4xl font-semibold text-medium">{t.xp(result.xpAwarded)}</p>
        </div>
      )}
    </section>
  )
}
