import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { candidate } from '@/test/fixtures'
import { adminStore, renderRoute } from '@/test/render'
import { server } from '@/test/server'

const ITEMS = [
  ['Trilha', '/track'],
  ['Questões', '/questions'],
  ['Simulação', '/simulations/new'],
]

function renderShell(path = '/track') {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
  return renderRoute(path, { store })
}

async function shell() {
  return screen.findByRole('navigation', { name: 'Navegação principal' })
}

function links(nav: HTMLElement) {
  return within(nav)
    .getAllByRole('link')
    .map((link) => [link.textContent, link.getAttribute('href')])
}

describe('AppShell', () => {
  it('barra do topo com Trilha, Questões e Simulação, e Trilha marcada', async () => {
    renderShell()
    const nav = await shell()
    expect(links(nav)).toEqual(ITEMS)
    expect(within(nav).getByRole('link', { name: 'Trilha' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('a navegação inferior tem os mesmos três itens', async () => {
    renderShell()
    await shell()
    expect(links(screen.getByRole('navigation', { name: 'Navegação inferior' }))).toEqual(ITEMS)
  })

  it('sequência e XP na barra, vindos da API, sem o aviso de dados de exemplo', async () => {
    renderShell()
    await shell()
    expect(await screen.findByTitle('Sequência de 6 dias')).toHaveTextContent('6')
    expect(screen.getByTitle('1.240 XP')).toHaveTextContent('1.240')
  })

  it('a área logada não mostra nem consulta o estado da API', async () => {
    const health: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).pathname.startsWith('/actuator')) health.push(request.url)
    })
    try {
      renderShell()
      await shell()
      await screen.findByTitle('Sequência de 6 dias')
      expect(screen.queryByText(/^API (online|indisponível)/)).not.toBeInTheDocument()
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
      expect(health).toEqual([])
    } finally {
      server.events.removeAllListeners()
    }
  })

  it('a busca leva à trilha com o termo', async () => {
    const user = userEvent.setup()
    const { router } = renderShell('/simulations/new')
    await shell()
    const search = within(screen.getByRole('banner')).getAllByRole('searchbox', {
      name: 'Buscar competência',
    })[0]
    await user.type(search, 'sql{Enter}')
    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    expect(router.state.location.search).toBe('?q=sql')
  })

  it('na trilha, a busca começa com o termo da URL', async () => {
    renderShell('/track?q=sql')
    await shell()
    expect(
      within(screen.getByRole('banner')).getAllByRole('searchbox', {
        name: 'Buscar competência',
      })[0],
    ).toHaveValue('sql')
  })

  it('no celular, a lupa abre e fecha o campo de busca', async () => {
    const user = userEvent.setup()
    renderShell()
    await shell()
    const toggle = screen.getByRole('button', { name: 'Abrir busca' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getAllByRole('searchbox')).toHaveLength(1)

    await user.click(toggle)
    const close = screen.getByRole('button', { name: 'Fechar busca' })
    expect(close).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById(close.getAttribute('aria-controls') ?? '')
    expect(panel).not.toBeNull()
    expect(within(panel as HTMLElement).getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getAllByRole('searchbox')).toHaveLength(2)

    await user.click(close)
    const reopen = screen.getByRole('button', { name: 'Abrir busca' })
    expect(reopen).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getAllByRole('searchbox')).toHaveLength(1)
  })

  it('ao sair da busca na URL, o campo esvazia; ao trocar o termo, mostra o novo', async () => {
    const { router } = renderShell('/track?q=sql')
    await shell()
    const field = () =>
      within(screen.getByRole('banner')).getAllByRole('searchbox', {
        name: 'Buscar competência',
      })[0]
    expect(field()).toHaveValue('sql')

    await act(() => router.navigate('/track?q=b'))
    await waitFor(() => expect(field()).toHaveValue('b'))

    await act(() => router.navigate('/track'))
    await waitFor(() => expect(field()).toHaveValue(''))
  })

  it('o menu da conta abre com Perfil e Sair; Sair encerra a sessão', async () => {
    const user = userEvent.setup()
    refreshTokenStorage.set('refresh-1')
    const { router } = renderShell()
    await shell()
    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Conta de Ana' }),
    )
    expect(screen.getByRole('menuitem', { name: 'Perfil' })).toHaveAttribute('href', '/profile')
    const theme = within(screen.getByRole('group', { name: 'Tema' }))
    expect(theme.getAllByRole('menuitemradio').map((item) => item.textContent)).toEqual([
      'Escuro',
      'Claro',
      'Sistema',
    ])
    await user.click(screen.getByRole('menuitem', { name: 'Sair' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })

  it('a barra tem o seletor de tema e nenhum sino', async () => {
    renderShell()
    await shell()
    const banner = screen.getByRole('banner')
    expect(await within(banner).findByRole('button', { name: 'Tema: escuro' })).toBeInTheDocument()
    expect(within(banner).queryByRole('button', { name: /Notificações/ })).not.toBeInTheDocument()
  })

  it('marca nas duas navegações o item da rota aberta', async () => {
    renderShell('/questions')

    for (const name of ['Navegação principal', 'Navegação inferior']) {
      const nav = within(await screen.findByRole('navigation', { name }))
      expect(nav.getByRole('link', { name: 'Questões' })).toHaveAttribute('aria-current', 'page')
      expect(nav.getByRole('link', { name: 'Trilha' })).not.toHaveAttribute('aria-current')
    }
  })

  it('o item Perfil do menu da conta leva ao perfil', async () => {
    const user = userEvent.setup()
    const { router } = renderShell()
    await shell()
    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Conta de Ana' }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Perfil' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/profile'))
  })

  it('Sair troca a entrada por /login, sem empilhar outra', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
    refreshTokenStorage.set('refresh-1')
    const user = userEvent.setup()
    const { router } = renderRoute('/track', { store })
    await shell()
    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Conta de Ana' }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    await waitFor(() => expect(store.getState().auth.status).toBe('anonymous'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(refreshTokenStorage.get()).toBeNull()
    expect(router.state.historyAction).toBe('REPLACE')
  })
  describe('para o admin', () => {
    it('as duas navegações têm só Usuários, marcado na gestão', async () => {
      renderRoute('/admin/users', { store: adminStore() })
      const nav = await shell()

      expect(links(nav)).toEqual([['Usuários', '/admin/users']])
      expect(within(nav).getByRole('link', { name: 'Usuários' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      expect(links(screen.getByRole('navigation', { name: 'Navegação inferior' }))).toEqual([
        ['Usuários', '/admin/users'],
      ])
    })

    it('a marca leva à gestão', async () => {
      renderRoute('/admin/users', { store: adminStore() })
      await shell()

      expect(
        within(screen.getByRole('banner')).getByRole('link', { name: 'DevReady' }),
      ).toHaveAttribute('href', '/admin/users')
    })

    it('sem busca de competência, sequência e XP, e sem pedir progresso nem conquistas', async () => {
      const asked: string[] = []
      const listen = ({ request }: { request: Request }) => {
        const { pathname } = new URL(request.url)
        if (pathname.startsWith('/api/v1/me/')) asked.push(pathname)
      }
      server.events.on('request:start', listen)
      try {
        renderRoute('/admin/users', { store: adminStore() })
        await shell()
        await screen.findByRole('heading', { level: 1, name: 'Usuários' })

        const banner = within(screen.getByRole('banner'))
        expect(banner.queryByRole('searchbox')).not.toBeInTheDocument()
        expect(banner.queryByRole('button', { name: 'Abrir busca' })).not.toBeInTheDocument()
        expect(screen.queryByTitle(/Sequência de/)).not.toBeInTheDocument()
        expect(screen.queryByTitle(/XP$/)).not.toBeInTheDocument()
        expect(banner.getByRole('button', { name: 'Tema: escuro' })).toBeInTheDocument()
        expect(banner.getByRole('button', { name: 'Conta de Administrador' })).toBeInTheDocument()
        expect(asked).toEqual([])
      } finally {
        server.events.removeListener('request:start', listen)
      }
    })

    it('no perfil, a mesma barra do admin', async () => {
      renderRoute('/profile', { store: adminStore() })
      const nav = await shell()

      expect(links(nav)).toEqual([['Usuários', '/admin/users']])
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })
  })
})
