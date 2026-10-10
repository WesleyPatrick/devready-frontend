import { Link, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { paths } from '@/app/paths'
import { appTexts } from '@/app/texts'
import { TerminalNotFound } from './TerminalNotFound'

const t = appTexts.notFound

export function NotFoundPage() {
  const { pathname } = useLocation()
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <section className="space-y-6 rounded-lg bg-surface px-6 py-10">
        <TerminalNotFound key={pathname} path={pathname} />
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.body}</p>
          <Button asChild className="mt-2">
            <Link to={paths.landing}>{t.back}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
