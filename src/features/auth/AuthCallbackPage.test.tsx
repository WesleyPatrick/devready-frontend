import { StrictMode } from 'react'
import { render, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { makeStore } from '@/app/store'
import { routes } from '@/app/routes'
import { server } from '@/test/server'
import { problem } from '@/test/handlers'
import { admin, tokens } from '@/test/fixtures'
import { renderRoute } from '@/test/render'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'

describe('AuthCallbackPage', () => {
  beforeEach(() => refreshTokenStorage.clear())

  it('troca o código por tokens e vai para o início', async () => {
    const { store, router } = renderRoute('/auth/callback?code=abc')

    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    expect(refreshTokenStorage.get()).toBe('refresh-1')
  })

  it('sem código ou com código inválido volta para o login com erro', async () => {
    server.use(
      http.post('/api/v1/auth/exchange', () => problem(401, 'Não autenticado', 'Código inválido.')),
    )
    const { store, router } = renderRoute('/auth/callback?code=ruim')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?error=social')
    expect(store.getState().auth.status).toBe('anonymous')

    const second = renderRoute('/auth/callback')
    await waitFor(() => expect(second.router.state.location.search).toBe('?error=social'))
    expect(second.store.getState().auth.status).toBe('anonymous')
  })

  it('não navega se a página saiu da tela antes da resposta da troca', async () => {
    let release = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.post('/api/v1/auth/exchange', async () => {
        await gate
        return HttpResponse.json(tokens)
      }),
    )
    const { store, router, unmount } = renderRoute('/auth/callback?code=abc')

    unmount()
    release()

    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(router.state.location.pathname).toBe('/auth/callback')
  })

  it('troca o código uma vez só, mesmo com o StrictMode montando duas vezes', async () => {
    let calls = 0
    server.use(
      http.post('/api/v1/auth/exchange', () => {
        calls += 1
        return HttpResponse.json(tokens)
      }),
    )
    const store = makeStore()
    const router = createMemoryRouter(routes, { initialEntries: ['/auth/callback?code=abc'] })

    render(
      <StrictMode>
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>
      </StrictMode>,
    )

    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    expect(calls).toBe(1)
  })
  it('o admin que volta do login social vai para a gestão de usuários', async () => {
    server.use(
      http.post('/api/v1/auth/exchange', () => HttpResponse.json({ ...tokens, user: admin })),
    )
    const { router } = renderRoute('/auth/callback?code=abc')
    const visited: string[] = []
    const unsubscribe = router.subscribe((state) => visited.push(state.location.pathname))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/users'))
    expect(visited).not.toContain('/track')
    unsubscribe()
  })

  it('a conta com senha provisória vai direto para a troca obrigatória', async () => {
    server.use(
      http.post('/api/v1/auth/exchange', () =>
        HttpResponse.json({ ...tokens, user: { ...admin, mustChangePassword: true } }),
      ),
    )
    const { router } = renderRoute('/auth/callback?code=abc')
    const visited: string[] = []
    const unsubscribe = router.subscribe((state) => visited.push(state.location.pathname))

    await waitFor(() => expect(router.state.location.pathname).toBe('/change-password'))
    expect(visited).not.toContain('/admin/users')
    unsubscribe()
  })
})
