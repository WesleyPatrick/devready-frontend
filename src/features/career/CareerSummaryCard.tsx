import { Braces, Pencil, Target } from 'lucide-react'
import { Link } from 'react-router'
import { CompanyMonogram } from '@/components/CompanyMonogram'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { paths } from '@/app/paths'
import { careerTexts } from './texts'
import type { CareerProfile } from './types'

const t = careerTexts.summary

export function CareerSummaryCard({ profile }: { profile: CareerProfile }) {
  return (
    <Panel
      title={t.title}
      icon={Target}
      iconClassName="text-brand"
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to={`${paths.onboarding}?edit=1`}>
            <Pencil aria-hidden />
            {t.edit}
          </Link>
        </Button>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">{t.companies}</dt>
          <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1.5 text-sm font-medium">
            {profile.companies.map((company) => (
              <CompanyMonogram key={company.slug} company={company} withName />
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t.stack}</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium">
            <Braces className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              {profile.stack.name}
              <span className="text-muted-foreground">
                {' '}
                · {careerTexts.areas[profile.stack.area]}
              </span>
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t.seniority}</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium">
            <Target className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            {careerTexts.seniorities[profile.seniority]}
          </dd>
        </div>
      </dl>
    </Panel>
  )
}
