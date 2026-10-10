import { act, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { makeStore } from '@/app/store'
import { sessionStarted, tokenRefreshed } from '@/features/auth/slice'
import { admin, candidate } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { adminStore, renderRoute, storeWithGoal } from '@/test/render'
import { server } from '@/test/server'

function recordCandidateRequests() {
  const asked: string[] = []
  const listen = ({ request }: { request: Request }) => {
    const { pathname } = new URL(request.url)
    if (pathname.startsWith('/api/v1/') && !pathname.startsWith('/api/v1/admin/'))
      asked.push(pathname)
  }
  server.events.on('request:start', listen)
  return { asked, stop: () => server.events.removeListener('request:start', listen) }
}

const CANDIDATE_ROUTES = [
  '/onboarding',
  '/track',
  '/track?q=sql',
  '/questions',
  '/challenges/two-sum',
  '/simulations/new',
  '/sessions/abc',
  '/sessions/abc/result',
]

describe('RequireCandidate', () => {
  it.each(CANDIDATE_ROUTES)(
    'o admin que abre %s vai para a gestão, sem pedir nada de candidato',
    async (path) => {
      server.use(
        http.get('/api/v1/career/profile', () =>
          problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.'),
        ),
      )
      const requests = recordCandidateRequests()
      try {
        const { router } = renderRoute(path, { store: adminStore() })
        const visited: string[] = []
        const unsubscribe = router.subscribe((state) => visited.push(state.location.pathname))

        expect(
          await screen.findByRole('heading', { level: 1, name: 'Usuários' }),
        ).toBeInTheDocument()
        expect(router.state.location.pathname).toBe('/admin/users')
        expect(router.state.historyAction).toBe('REPLACE')
        expect(visited).not.toContain('/onboarding')
        expect(requests.asked).toEqual([])
        unsubscribe()
      } finally {
        requests.stop()
      }
    },
  )

  it('o candidato com objetivo continua abrindo a trilha', async () => {
    const { router } = renderRoute('/track', { store: storeWithGoal() })

    expect(await screen.findByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/track')
  })

  it('o candidato promovido durante a sessão vai para a gestão na navegação seguinte', async () => {
    const store = storeWithGoal()
    const { router } = renderRoute('/track', { store })
    await screen.findByRole('navigation', { name: 'Navegação principal' })

    act(() => {
      store.dispatch(
        tokenRefreshed({ accessToken: 'access-2', user: { ...candidate, role: 'ADMIN' } }),
      )
    })
    await act(() => router.navigate('/questions'))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/users'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Usuários' })).toBeInTheDocument()
  })

  it('o admin rebaixado durante a sessão vira candidato: sem objetivo, vai ao onboarding', async () => {
    server.use(
      http.get('/api/v1/career/profile', () =>
        problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.'),
      ),
    )
    const store = adminStore()
    const { router } = renderRoute('/admin/users', { store })
    await screen.findByRole('heading', { level: 1, name: 'Usuários' })

    act(() => {
      store.dispatch(
        tokenRefreshed({ accessToken: 'access-2', user: { ...admin, role: 'CANDIDATE' } }),
      )
    })
    await act(() => router.navigate('/track'))

    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'))
  })

  it('o admin vê o perfil, sem ser mandado para a gestão', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'a', user: admin }))
    const { router } = renderRoute('/profile', { store })

    expect(await screen.findByRole('heading', { level: 1, name: 'Perfil' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/profile')
  })
})
