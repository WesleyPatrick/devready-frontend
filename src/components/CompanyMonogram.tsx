import { appTexts } from '@/app/texts'
import { formatList } from '@/lib/format'
import type { CompanyRef } from '@/lib/learning'
import { monogramOf } from '@/lib/monograms'
import { cn } from '@/lib/utils'

type Size = 'sm' | 'md'

export function MonogramCircle({ company, size = 'md' }: { company: CompanyRef; size?: Size }) {
  const { initials, color } = monogramOf(company.slug, company.name)
  return (
    <span
      aria-hidden
      style={{ backgroundColor: color }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-mono font-bold text-[#1b1b1b]',
        size === 'sm' ? 'size-[18px] text-[9px]' : 'size-5 text-[10px]',
      )}
    >
      {initials}
    </span>
  )
}

type Props = { company: CompanyRef; withName?: boolean; size?: Size; className?: string }

export function CompanyMonogram({ company, withName = false, size = 'md', className }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <MonogramCircle company={company} size={size} />
      {withName ? <span>{company.name}</span> : <span className="sr-only">{company.name}</span>}
    </span>
  )
}

export function CompanyStack({ companies }: { companies: CompanyRef[] }) {
  if (companies.length === 0) return null
  const sentence = appTexts.askedBy(formatList(companies.map((company) => company.name)))
  return (
    <span className="inline-flex items-center gap-0.5" title={sentence}>
      {companies.map((company) => (
        <MonogramCircle key={company.slug} company={company} size="sm" />
      ))}
      <span className="sr-only">{sentence}</span>
    </span>
  )
}
