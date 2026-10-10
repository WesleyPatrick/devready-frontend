import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import type { CurrentUser } from '@/features/auth/types'
import { admin, candidate } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { passwordChangeRequired } from '@/test/problem'
import { HttpResponse } from 'msw'
import { anonymousStore, renderRoute, storeWithGoal } from '@/test/render'
import { server } from '@/test/server'

function signedIn(user: CurrentUser) {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'access-1', user }))
  return store
}

const marked = (user: CurrentUser): CurrentUser => ({ ...user, mustChangePassword: true })

describe('RequirePasswordChange', () => {
  afterEach(() => server.events.removeAllListeners())

  it.each([
    ['/track', candidate],
    ['/questions', candidate],
    ['/onboarding', candidate],
    ['/profile', candidate],
    ['/admin/users', admin],
    ['/profile', admin],
  ])('com a senha provisória, %s leva à troca obrigatória', async (path, user) => {
    const requests: string[] = []
    server.events.on('request:start', ({ request }) => {
      requests.push(new URL(request.url).pathname)
    })
    const { router } = renderRoute(path, { store: signedIn(marked(user)) })

    await waitFor(() => expect(router.state.location.pathname).toBe('/change-password'))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Crie uma senha nova' }),
    ).toBeInTheDocument()
    expect(requests).toEqual([])
  })

  it.each([
    [candidate, '/track'],
    [admin, '/admin/users'],
  ])('sem a marca, /change-password leva ao início de quem entrou', async (user, home) => {
    const { router } = renderRoute('/change-password', { store: signedIn(user) })

    await waitFor(() => expect(router.state.location.pathname).toBe(home))
  })

  it('anônimo em /change-password vai para o login', async () => {
    const { router } = renderRoute('/change-password', { store: anonymousStore() })

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })

  it('o 403 da senha provisória de uma chamada qualquer marca a conta e leva à troca', async () => {
    server.use(http.get('/api/v1/career/track', passwordChangeRequired))
    const store = storeWithGoal()
    const { router } = renderRoute('/track', { store })

    await waitFor(() => expect(router.state.location.pathname).toBe('/change-password'))
    expect(store.getState().auth.user?.mustChangePassword).toBe(true)
  })

  it('reconhece o 403 pelo code, mesmo com outro título', async () => {
    server.use(
      http.get('/api/v1/career/track', () =>
        HttpResponse.json(
          { title: 'Outro título', status: 403, detail: 'x', code: 'password_change_required' },
          { status: 403 },
        ),
      ),
    )
    const store = storeWithGoal()
    const { router } = renderRoute('/track', { store })

    await waitFor(() => expect(router.state.location.pathname).toBe('/change-password'))
    expect(store.getState().auth.user?.mustChangePassword).toBe(true)
  })

  it('sem o code, o título "Senha provisória" ainda serve de reserva', async () => {
    server.use(
      http.get('/api/v1/career/track', () =>
        problem(403, 'Senha provisória', 'Defina uma senha nova para continuar.'),
      ),
    )
    const store = storeWithGoal()
    const { router } = renderRoute('/track', { store })

    await waitFor(() => expect(router.state.location.pathname).toBe('/change-password'))
  })

  it('outro 403 não mexe na marca', async () => {
    server.use(
      http.get('/api/v1/career/track', () => problem(403, 'Sem permissão', 'Acesso negado.')),
    )
    const store = storeWithGoal()
    const { router } = renderRoute('/track', { store })

    await screen.findByText('Não foi possível carregar a trilha.')
    expect(store.getState().auth.user?.mustChangePassword).toBe(false)
    expect(router.state.location.pathname).toBe('/track')
  })
})
