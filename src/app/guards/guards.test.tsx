import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { adminStore, renderRoute } from '@/test/render'
import { makeStore } from '@/app/store'
import { sessionEnded, sessionStarted } from '@/features/auth/slice'
import { landingTexts } from '@/features/landing/texts'
import { candidate } from '@/test/fixtures'

describe('guards', () => {
  it('manda anônimo para o login guardando a origem', async () => {
    const store = makeStore()
    store.dispatch(sessionEnded())
    const { router } = renderRoute('/profile', { store })

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.state).toEqual({ from: '/profile' })
  })

  it('guarda a origem com query string e hash', async () => {
    const store = makeStore()
    store.dispatch(sessionEnded())
    const { router } = renderRoute('/profile?tab=senha#seguranca', { store })

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.state).toEqual({ from: '/profile?tab=senha#seguranca' })
  })

  it('o login volta para a origem completa depois de entrar', async () => {
    const store = makeStore()
    store.dispatch(sessionEnded())
    const user = userEvent.setup()
    const { router } = renderRoute('/profile?tab=senha', { store })

    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/profile'))
    expect(router.state.location.search).toBe('?tab=senha')
  })

  it('mostra carregando enquanto a sessão é desconhecida', async () => {
    renderRoute('/profile')
    expect(await screen.findByRole('status')).toHaveTextContent('Carregando…')
  })

  it('na raiz, mostra só o carregando enquanto a sessão é desconhecida, sem piscar a landing', async () => {
    renderRoute('/')

    expect(await screen.findByRole('status')).toHaveTextContent('Carregando…')
    expect(
      screen.queryByRole('heading', { level: 1, name: landingTexts.hero.title }),
    ).not.toBeInTheDocument()
  })

  it('manda usuário autenticado que abre o login para o início', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
    const { router } = renderRoute('/login', { store })

    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
  })
  it.each(['/', '/login', '/register'])(
    'manda o admin que abre %s para a gestão de usuários',
    async (path) => {
      const { router } = renderRoute(path, { store: adminStore() })

      await waitFor(() => expect(router.state.location.pathname).toBe('/admin/users'))
    },
  )
})
