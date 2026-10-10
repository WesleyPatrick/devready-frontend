import { useId, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useMatch, useSearchParams } from 'react-router'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Toaster } from '@/components/Toaster'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/app/hooks'
import { homeFor, paths } from '@/app/paths'
import { appTexts } from '@/app/texts'
import { selectCurrentUser } from '@/features/auth/slice'
import { AchievementToasts } from '@/features/progress/AchievementToasts'
import { ProgressChips } from '@/features/progress/ProgressChips'
import { CompetencySearch } from '@/features/track/CompetencySearch'
import { cn } from '@/lib/utils'
import { navItemsFor } from './navItems'
import { useArrivalCelebration } from './useArrivalCelebration'
import { UserMenu } from './UserMenu'

const t = appTexts.nav

export function AppShell() {
  useArrivalCelebration()
  const user = useAppSelector(selectCurrentUser)
  const isAdmin = user?.role === 'ADMIN'
  const items = navItemsFor(user?.role)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchId = useId()
  const location = useLocation()
  const [params] = useSearchParams()
  const onChallenge = useMatch(paths.challenge) !== null
  const onSession = useMatch(paths.session) !== null
  const fullHeight = onChallenge || onSession
  const query = location.pathname === paths.track ? (params.get('q') ?? '') : ''

  return (
    <div
      className={cn(
        'flex flex-col bg-background text-foreground',
        fullHeight ? 'h-dvh' : 'min-h-screen',
      )}
    >
      <header className="sticky top-0 z-40 border-b bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 lg:gap-6">
          <Link to={homeFor(user)} aria-label={appTexts.brand} className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label={t.label} className="hidden h-full lg:block">
            <ul className="flex h-full items-center gap-5">
              {items.map(({ to, label, icon: Icon }) => (
                <li key={to} className="h-full">
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'flex h-full items-center gap-1.5 border-b-2 text-sm transition-colors',
                        isActive
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      )
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {!isAdmin && (
              <>
                <CompetencySearch
                  key={query}
                  initial={query}
                  className="hidden w-44 lg:block xl:w-60"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label={searchOpen ? t.closeSearch : t.openSearch}
                  aria-expanded={searchOpen}
                  aria-controls={searchId}
                  onClick={() => setSearchOpen((open) => !open)}
                >
                  {searchOpen ? (
                    <X className="size-4" aria-hidden />
                  ) : (
                    <Search className="size-4" aria-hidden />
                  )}
                </Button>
                <ProgressChips />
              </>
            )}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <UserMenu />
          </div>
        </div>
        {searchOpen && !isAdmin && (
          <div id={searchId} className="border-t px-4 py-2 lg:hidden">
            <CompetencySearch
              key={query}
              initial={query}
              autoFocus
              onDone={() => setSearchOpen(false)}
            />
          </div>
        )}
      </header>
      <main
        className={cn(
          'w-full flex-1',
          fullHeight
            ? 'flex min-h-0 flex-col pb-16 lg:pb-0'
            : 'mx-auto max-w-7xl px-4 pt-6 pb-24 lg:pb-10',
        )}
      >
        <Outlet />
      </main>
      <nav
        aria-label={t.mobileLabel}
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface lg:hidden"
      >
        <ul className={cn('grid', isAdmin ? 'grid-cols-1' : 'grid-cols-3')}>
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 flex-col items-center justify-center gap-1 py-2 text-xs',
                    isActive ? 'text-brand' : 'text-muted-foreground',
                  )
                }
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Toaster />
      {!isAdmin && <AchievementToasts />}
    </div>
  )
}
