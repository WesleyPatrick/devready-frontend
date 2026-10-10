import { ChartLine, Info } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { DifficultyBar } from '@/components/DifficultyBar'
import { Panel } from '@/components/Panel'
import { ProgressRing } from '@/components/ProgressRing'
import { careerTexts } from '@/features/career/texts'
import type { CareerProfile } from '@/features/career/types'
import { formatList, formatNumber } from '@/lib/format'
import { DIFFICULTIES, DIFFICULTY_STROKE } from '@/lib/learning'
import { trackTexts } from './texts'
import type { Track } from './types'

const t = trackTexts

export function PlanCard({ plan, profile }: { plan: Track['plan']; profile: CareerProfile }) {
  const area = careerTexts.areas[profile.stack.area]
  const seniority = careerTexts.seniorities[profile.seniority]
  const missing = plan.missingCompanies.map((company) => company.name)
  return (
    <Panel>
      <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto]">
        <ProgressRing
          label={t.plan.ring(plan.doneCompetencies, plan.totalCompetencies)}
          total={plan.totalCompetencies}
          segments={DIFFICULTIES.map((d) => ({
            value: plan.byDifficulty[d].done,
            className: DIFFICULTY_STROKE[d],
          }))}
        >
          <span className="block font-mono text-xl font-semibold">{plan.doneCompetencies}</span>
          <span className="block text-[11px] text-muted-foreground">
            {t.plan.of(plan.totalCompetencies)}
          </span>
        </ProgressRing>
        <div className="min-w-0 space-y-2">
          <h2 className="text-base font-semibold">{t.plan.title(area, seniority)}</h2>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ChartLine className="size-3.5" aria-hidden />
            {t.plan.jobs(formatNumber(plan.jobsAnalyzed))}
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2 lg:col-span-1 lg:w-56">
          {DIFFICULTIES.map((d) => (
            <DifficultyBar
              key={d}
              difficulty={d}
              done={plan.byDifficulty[d].done}
              total={plan.byDifficulty[d].total}
            />
          ))}
        </div>
      </div>
      {missing.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" aria-hidden />
          <span>{t.plan.missing(formatList(missing), area, missing.length)}</span>
          <Link
            to={`${paths.onboarding}?edit=1`}
            className="rounded-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {t.goal.edit}
          </Link>
        </p>
      )}
    </Panel>
  )
}
