import { CircleCheck, CircleDashed } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sameItem, type SessionItem } from './items'
import type { ItemKey } from './slice'
import { sessionTexts } from './texts'

const t = sessionTexts.items

export function ItemNav({
  items,
  current,
  compact,
  onSelect,
}: {
  items: SessionItem[]
  current: ItemKey
  compact: boolean
  onSelect: (item: ItemKey) => void
}) {
  return (
    <nav
      aria-label={t.label}
      className={cn('shrink-0 overflow-y-auto border-r bg-surface p-2', compact ? 'w-14' : 'w-64')}
    >
      <ol role="list" className="m-0 list-none space-y-1 p-0">
        {items.map((item) => {
          const selected = sameItem(item.key, current)
          return (
            <li key={`${item.key.kind}-${item.key.position}`}>
              <button
                type="button"
                aria-current={selected ? 'step' : undefined}
                aria-label={compact ? t.goTo(item.number, item.title) : undefined}
                onClick={() => onSelect(item.key)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  selected ? 'bg-muted font-medium' : 'hover:bg-muted',
                  compact && 'justify-center px-0 font-mono',
                )}
              >
                {compact ? (
                  item.number
                ) : (
                  <>
                    {item.done ? (
                      <CircleCheck className="size-4 shrink-0 text-easy" aria-hidden />
                    ) : (
                      <CircleDashed className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {item.number}. {item.title}
                    </span>
                    <span className="sr-only">, {item.done ? t.done : t.open}</span>
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
