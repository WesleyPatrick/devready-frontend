import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router'
import { paths } from '@/app/paths'
import { cn } from '@/lib/utils'
import { trackTexts } from './texts'

const t = trackTexts.search

type Props = { initial: string; onDone?: () => void; autoFocus?: boolean; className?: string }

export function CompetencySearch({ initial, onDone, autoFocus, className }: Props) {
  const [value, setValue] = useState(initial)
  const navigate = useNavigate()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const term = value.trim()
    navigate({ pathname: paths.track, search: term ? `?q=${encodeURIComponent(term)}` : '' })
    onDone?.()
  }

  return (
    <form role="search" aria-label={t.label} onSubmit={onSubmit} className={className}>
      <label className="flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
        <Search className="size-3.5 shrink-0" aria-hidden />
        <input
          type="search"
          aria-label={t.label}
          placeholder={t.placeholder}
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => setValue(event.target.value)}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground',
          )}
        />
      </label>
    </form>
  )
}
