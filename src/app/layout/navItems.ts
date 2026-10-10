import { FileCode, Map, Timer, Users, type LucideIcon } from 'lucide-react'
import { paths } from '@/app/paths'
import { appTexts } from '@/app/texts'
import type { Role } from '@/features/auth/types'

export type NavItem = { to: string; label: string; icon: LucideIcon }

export const NAV_ITEMS: readonly NavItem[] = [
  { to: paths.track, label: appTexts.nav.track, icon: Map },
  { to: paths.questions, label: appTexts.nav.questions, icon: FileCode },
  { to: paths.newSimulation, label: appTexts.nav.simulation, icon: Timer },
]

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { to: paths.adminUsers, label: appTexts.nav.users, icon: Users },
]

export function navItemsFor(role: Role | undefined): readonly NavItem[] {
  return role === 'ADMIN' ? ADMIN_NAV_ITEMS : NAV_ITEMS
}
