import type { CurrentUser } from '@/features/auth/types'

export const paths = {
  landing: '/',
  home: '/track',
  track: '/track',
  questions: '/questions',
  challenge: '/challenges/:slug',
  onboarding: '/onboarding',
  login: '/login',
  register: '/register',
  authCallback: '/auth/callback',
  profile: '/profile',
  newSimulation: '/simulations/new',
  session: '/sessions/:id',
  sessionResult: '/sessions/:id/result',
  adminUsers: '/admin/users',
  changePassword: '/change-password',
} as const

export function homeFor(
  user:
    | (Pick<CurrentUser, 'role'> & Partial<Pick<CurrentUser, 'mustChangePassword'>>)
    | null
    | undefined,
) {
  if (user?.mustChangePassword) return paths.changePassword
  return user?.role === 'ADMIN' ? paths.adminUsers : paths.home
}

export const challengePath = (slug: string) => `/challenges/${encodeURIComponent(slug)}`

export const sessionPath = (id: string) => `/sessions/${encodeURIComponent(id)}`

export const sessionResultPath = (id: string) => `/sessions/${encodeURIComponent(id)}/result`
