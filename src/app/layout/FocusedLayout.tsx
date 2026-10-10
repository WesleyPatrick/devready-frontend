import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserMenu } from './UserMenu'

export function FocusedFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu showProfile={false} showTheme={false} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-10">{children}</main>
    </div>
  )
}

export function FocusedLayout() {
  return (
    <FocusedFrame>
      <Outlet />
    </FocusedFrame>
  )
}
