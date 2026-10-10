import type { ReactNode } from 'react'
import { Link, Outlet } from 'react-router'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/app/hooks'
import { homeFor, paths } from '@/app/paths'
import { appTexts } from '@/app/texts'
import { selectCurrentUser, selectSessionStatus } from '@/features/auth/slice'
import { ApiStatus } from '@/features/health/ApiStatus'

export function PublicLayout({ children }: { children?: ReactNode }) {
  const status = useAppSelector(selectSessionStatus)
  const user = useAppSelector(selectCurrentUser)
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to={paths.landing} aria-label={appTexts.brand}>
            <Logo />
          </Link>
          <nav aria-label={appTexts.nav.label} className="flex items-center gap-2">
            <Link
              to="/#como-funciona"
              className="hidden px-2 text-sm text-muted-foreground hover:text-foreground md:inline"
            >
              {appTexts.nav.how}
            </Link>
            <Link
              to="/#empresas"
              className="hidden px-2 text-sm text-muted-foreground hover:text-foreground md:inline"
            >
              {appTexts.nav.companies}
            </Link>
            <ThemeToggle />
            {status === 'authenticated' ? (
              <Button asChild>
                <Link to={homeFor(user)}>
                  {user?.role === 'ADMIN' ? appTexts.nav.goToUsers : appTexts.nav.goToTrack}
                </Link>
              </Button>
            ) : status === 'anonymous' ? (
              <>
                <Button asChild variant="ghost" className="max-[359px]:hidden">
                  <Link to={paths.login}>{appTexts.nav.login}</Link>
                </Button>
                <Button asChild>
                  <Link to={paths.register}>{appTexts.nav.register}</Link>
                </Button>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children ?? <Outlet />}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{appTexts.footer}</span>
          <ApiStatus />
        </div>
      </footer>
    </div>
  )
}
