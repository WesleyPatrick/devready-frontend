import { createElement, useId } from 'react'
import { ChoiceCard } from './ChoiceCard'
import { AREA_ICONS } from './stepIcons'
import { careerTexts } from './texts'
import type { AreaSlug, StackOption } from './types'

const AREAS: AreaSlug[] = ['backend', 'frontend', 'devops']

type Props = {
  stacks: StackOption[]
  selected: string | null
  onChange: (slug: string) => void
}

export function StackStep({ stacks, selected, onChange }: Props) {
  const name = useId()
  return (
    <div className="space-y-6">
      {AREAS.map((area) => {
        const items = stacks.filter((stack) => stack.area === area)
        if (items.length === 0) return null
        return (
          <fieldset key={area} className="min-w-0">
            <legend className="text-sm font-medium">{careerTexts.areas[area]}</legend>
            <div className="grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((stack) => (
                <ChoiceCard
                  key={stack.slug}
                  type="radio"
                  name={name}
                  value={stack.slug}
                  title={stack.name}
                  leading={createElement(AREA_ICONS[stack.area], {
                    className: 'size-5 shrink-0 text-muted-foreground',
                    'aria-hidden': true,
                  })}
                  checked={stack.slug === selected}
                  onChange={() => onChange(stack.slug)}
                />
              ))}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
