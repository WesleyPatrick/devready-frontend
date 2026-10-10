import { createElement, useId } from 'react'
import type { Level } from '@/features/catalog/api'
import { ChoiceCard } from './ChoiceCard'
import { SENIORITY_ICONS } from './stepIcons'
import { careerTexts } from './texts'

type Props = {
  seniorities: Level[]
  selected: Level | null
  onChange: (level: Level) => void
}

export function SeniorityStep({ seniorities, selected, onChange }: Props) {
  const name = useId()
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{careerTexts.summary.seniority}</legend>
      <div className="grid gap-3 md:grid-cols-3">
        {seniorities.map((level) => (
          <ChoiceCard
            key={level}
            type="radio"
            name={name}
            value={level}
            title={careerTexts.seniorities[level]}
            description={careerTexts.seniorityHints[level]}
            leading={createElement(SENIORITY_ICONS[level], {
              className: 'size-5 shrink-0 text-brand',
              'aria-hidden': true,
            })}
            checked={level === selected}
            onChange={() => onChange(level)}
          />
        ))}
      </div>
    </fieldset>
  )
}
