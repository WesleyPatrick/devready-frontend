import { ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { sameItem, type SessionItem } from './items'
import type { ItemKey } from './slice'
import { sessionTexts } from './texts'

const t = sessionTexts.items

export function ItemMenu({
  items,
  current,
  onSelect,
}: {
  items: SessionItem[]
  current: ItemKey
  onSelect: (item: ItemKey) => void
}) {
  const index = items.findIndex((item) => sameItem(item.key, current))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ListOrdered aria-hidden />
          {t.menu(index + 1, items.length)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 w-auto min-w-64 max-w-[calc(100vw-2rem)] overflow-y-auto"
      >
        {items.map((item) => (
          <DropdownMenuItem
            key={`${item.key.kind}-${item.key.position}`}
            onSelect={() => onSelect(item.key)}
          >
            {item.number}. {item.title}
            <span className="sr-only">, {item.done ? t.done : t.open}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
