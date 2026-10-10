import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { appTexts } from '@/app/texts'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-bold tracking-tight', className)}>
      <Flame className="size-5 text-brand" aria-hidden />
      <span data-slot="wordmark" aria-hidden className="text-[17px] max-[379px]:hidden">
        dev<span className="text-brand">ready</span>
      </span>
      <span className="sr-only">{appTexts.brand}</span>
    </span>
  )
}
