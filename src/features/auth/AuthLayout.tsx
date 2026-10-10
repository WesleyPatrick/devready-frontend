import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'
import { brandPointIcons } from './brandIcons'
import { authTexts } from './texts'

export function AuthLayout({ children }: { children: ReactNode }) {
  const t = authTexts.brandPanel
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 lg:grid-cols-2 lg:items-center lg:py-16">
      <div className="mx-auto w-full max-w-md">{children}</div>
      <section
        aria-label={t.title}
        className="hidden rounded-lg bg-surface p-8 lg:order-first lg:block"
      >
        <Logo />
        <h2 className="mt-8 text-2xl font-semibold tracking-tight">{t.title}</h2>
        <ul className="mt-8 space-y-4">
          {t.points.map((point, index) => {
            const Icon = brandPointIcons[index]
            return (
              <li key={point} className="flex gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <span className="text-muted-foreground">{point}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
