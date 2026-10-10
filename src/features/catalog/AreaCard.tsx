import { createElement, Fragment, useId } from 'react'
import type { Area } from './api'
import { areaIcon } from './areaIcons'
import { catalogTexts } from './texts'

type Props = { area: Area; name: string; selected: boolean; onSelect: (area: Area) => void }

export function AreaCard({ area, name, selected, onSelect }: Props) {
  const t = catalogTexts.card
  const titleId = useId()
  const detailsId = useId()
  const details = [
    t.questions(area.questionCount),
    t.challenges(area.challengeCount),
    t.duration(area.durationMinutes),
    t.weight(area.objectiveWeight),
  ]
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent has-checked:bg-primary/10 has-focus-visible:ring-2 has-focus-visible:ring-ring">
      <input
        type="radio"
        className="size-4 shrink-0 accent-primary"
        name={name}
        value={area.slug}
        checked={selected}
        onChange={() => onSelect(area)}
        aria-labelledby={titleId}
        aria-describedby={detailsId}
      />
      {createElement(areaIcon(area.slug), {
        className: 'size-4 shrink-0 text-brand',
        'aria-hidden': true,
      })}
      <span className="min-w-0 flex-1 md:flex md:items-baseline md:gap-4">
        <span id={titleId} className="block font-medium md:w-24 md:shrink-0">
          {area.name}
        </span>
        <span id={detailsId} className="block font-mono text-xs text-muted-foreground">
          {details.map((detail, index) => (
            <Fragment key={detail}>
              {index > 0 && ' · '}
              <span>{detail}</span>
            </Fragment>
          ))}
        </span>
      </span>
    </label>
  )
}
