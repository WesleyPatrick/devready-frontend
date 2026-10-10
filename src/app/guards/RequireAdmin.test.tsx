import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { candidate } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { adminStore, anonymousStore, renderRoute } from '@/test/render'
import { server } from '@/test/server'

describe('RequireAdmin', () => {
  it('o admin sem objetivo de carreira abre a gestão na área logada, sem ir ao onboarding', async () => {
    server.use(
      http.get('/api/v1/career/profile', () =>
        problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.'),
      ),
    )
    const { router } = renderRoute('/admin/users', { store: adminStore() })

    const title = await screen.findByRole('heading', { level: 1, name: 'Usuários' })
    expect(title.className).toBe('text-2xl font-semibold tracking-tight')
    expect(screen.getByRole('button', { name: 'Conta de Administrador' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin/users')
  })

  it('quem não é admin vê a página não encontrada de sempre, e a lista nem é pedida', async () => {
    const asked: string[] = []
    const listen = ({ request }: { request: Request }) => {
      if (new URL(request.url).pathname.startsWith('/api/v1/admin/')) asked.push(request.url)
    }
    server.events.on('request:start', listen)
    try {
      const store = makeStore()
      store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
      renderRoute('/admin/users', { store })

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ir para a trilha' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Conta de Ana' })).not.toBeInTheDocument()
      expect(asked).toEqual([])
    } finally {
      server.events.removeListener('request:start', listen)
    }
  })

  it('anônimo vai para o login, como no resto da área logada', async () => {
    const { router } = renderRoute('/admin/users', { store: anonymousStore() })

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.state).toEqual({ from: '/admin/users' })
  })
})
