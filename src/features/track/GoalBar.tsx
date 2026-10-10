import { Braces, Pencil, Target } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '@/app/paths'
import { CompanyMonogram } from '@/components/CompanyMonogram'
import { Button } from '@/components/ui/button'
import { careerTexts } from '@/features/career/texts'
import type { CareerProfile } from '@/features/career/types'
import { trackTexts } from './texts'

const t = trackTexts.goal

export function GoalBar({ profile }: { profile: CareerProfile }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-surface px-4 py-2.5 text-sm">
      <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
        {t.title}
      </h2>
      <ul className="m-0 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0" role="list">
        {profile.companies.map((company) => (
          <li key={company.slug}>
            <CompanyMonogram company={company} withName size="sm" />
          </li>
        ))}
      </ul>
      <span className="inline-flex items-center gap-1.5">
        <Braces className="size-3.5 text-muted-foreground" aria-hidden />
        {profile.stack.name}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Target className="size-3.5 text-muted-foreground" aria-hidden />
        {careerTexts.seniorities[profile.seniority]}
      </span>
      <Button asChild variant="ghost" size="sm" className="sm:ml-auto">
        <Link to={`${paths.onboarding}?edit=1`}>
          <Pencil aria-hidden /> {t.edit}
        </Link>
      </Button>
    </div>
  )
}
