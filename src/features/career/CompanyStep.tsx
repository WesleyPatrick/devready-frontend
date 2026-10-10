import { Button } from '@/components/ui/button'
import { MonogramCircle } from '@/components/CompanyMonogram'
import { ChoiceCard } from './ChoiceCard'
import { GROUPS, MAX_COMPANIES } from './companies'
import { careerTexts } from './texts'
import type { CompanyOption } from './types'

const t = careerTexts.onboarding.companies

type Props = {
  companies: CompanyOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function toggle(selected: string[], slug: string) {
  return selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug]
}

export function CompanyStep({ companies, selected, onChange }: Props) {
  const full = selected.length >= MAX_COMPANIES
  return (
    <div className="space-y-8">
      {GROUPS.map((group) => {
        const items = companies.filter((company) => company.group === group)
        if (items.length === 0) return null
        return (
          <fieldset key={group} className="min-w-0">
            <legend className="float-left w-full py-1 text-sm font-medium sm:w-auto">
              {careerTexts.groups[group]}
            </legend>
            <Button
              type="button"
              variant="link"
              aria-label={t.wholeGroupOf(careerTexts.groups[group])}
              className="h-auto px-0 py-1 text-brand sm:float-right"
              onClick={() => onChange(items.slice(0, MAX_COMPANIES).map((c) => c.slug))}
            >
              {t.wholeGroup}
            </Button>
            <div className="clear-both grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((company) => {
                const checked = selected.includes(company.slug)
                return (
                  <ChoiceCard
                    key={company.slug}
                    type="checkbox"
                    value={company.slug}
                    title={company.name}
                    leading={<MonogramCircle company={company} />}
                    checked={checked}
                    disabled={!checked && full}
                    onChange={() => onChange(toggle(selected, company.slug))}
                  />
                )
              })}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
