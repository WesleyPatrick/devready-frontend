import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { questionsTexts } from './texts'

const t = questionsTexts.page.pagination

type Props = { page: number; totalPages: number; onChange: (page: number) => void }

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label={t.label} className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t.previous}
        aria-disabled={page <= 1}
        className="aria-disabled:pointer-events-none aria-disabled:[&_svg]:opacity-50"
        onClick={() => {
          if (page > 1) onChange(page - 1)
        }}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <span className="font-mono text-xs" aria-live="polite">
        {t.status(page, totalPages)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t.next}
        aria-disabled={page >= totalPages}
        className="aria-disabled:pointer-events-none aria-disabled:[&_svg]:opacity-50"
        onClick={() => {
          if (page < totalPages) onChange(page + 1)
        }}
      >
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  )
}
