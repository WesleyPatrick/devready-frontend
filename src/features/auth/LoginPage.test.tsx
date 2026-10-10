import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { problem } from '@/test/handlers'
import { admin, tokens } from '@/test/fixtures'
import { anonymousStore, renderRoute } from '@/test/render'
import { authTexts } from './texts'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { makeStore } from '@/app/store'
import { sessionEnded } from './slice'

describe('LoginPage', () => {
  beforeEach(() => refreshTokenStorage.clear())

  it('entra e vai para a página inicial', async () => {
    const user = userEvent.setup()
    const { store, router } = renderRoute('/login', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    expect(refreshTokenStorage.get()).toBe('refresh-1')
  })

  it('mostra o erro da API em credenciais inválidas', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        problem(401, 'Não autenticado', 'E-mail ou senha incorretos.'),
      ),
    )
    const user = userEvent.setup()
    renderRoute('/login', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'errada-123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('valida antes de enviar e mostra o erro do provedor social vindo da URL', async () => {
    const user = userEvent.setup()
    renderRoute('/login?error=social', { store: anonymousStore() })

    expect(await screen.findByRole('alert')).toHaveTextContent('provedor social')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar com Google' })).toHaveAttribute(
      'href',
      '/oauth2/authorization/google',
    )
  })

  it('avisa quando não consegue falar com o servidor', async () => {
    server.use(http.post('/api/v1/auth/login', () => HttpResponse.error()))
    const user = userEvent.setup()
    renderRoute('/login', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível falar com o servidor. Tente de novo.',
    )
  })

  it('liga os erros de validação aos campos para leitores de tela', async () => {
    const user = userEvent.setup()
    renderRoute('/login', { store: anonymousStore() })

    await screen.findByLabelText('E-mail')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    const email = await screen.findByRole('textbox', { name: 'E-mail' })
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'))
    expect(email).toHaveAccessibleDescription('Informe o e-mail.')
    const password = screen.getByLabelText('Senha')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAccessibleDescription('Informe a senha.')
  })

  it('avisa que a senha mudou quando volta da troca de senha e limpa o aviso', async () => {
    const store = makeStore()
    store.dispatch(sessionEnded('password-changed'))
    const { router } = renderRoute('/profile', { store })

    await waitFor(() => expect(router.state.location.search).toBe('?notice=password-changed'))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Senha alterada. Entre com a senha nova.',
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await waitFor(() => expect(store.getState().auth.notice).toBeNull())
  })

  it('aviso desconhecido na URL não aparece', async () => {
    renderRoute('/login?notice=toString', { store: anonymousStore() })

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('mostra o aviso de conta desativada vindo da URL', async () => {
    renderRoute('/login?error=inactive', { store: anonymousStore() })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta conta está desativada. Fale com o administrador da plataforma.',
    )
  })

  it('mostra o detail do limite de tentativas (429)', async () => {
    server.use(
      http.post('/api/v1/auth/login', () =>
        problem(429, 'Muitas tentativas', 'Aguarde um minuto e tente de novo.'),
      ),
    )
    const user = userEvent.setup()
    renderRoute('/login', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Aguarde um minuto e tente de novo.')
  })

  it.each(['//evil.example.com/profile', 'https://evil.example.com', 'profile'])(
    'ignora uma origem que não é caminho interno (%s)',
    async (from) => {
      const user = userEvent.setup()
      const { router } = renderRoute(
        { pathname: '/login', state: { from } },
        { store: anonymousStore() },
      )

      await user.type(await screen.findByLabelText('E-mail'), 'ana@example.com')
      await user.type(screen.getByLabelText('Senha'), 'senha-forte')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))

      await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    },
  )

  it('mostra o painel da marca ao lado do formulário', async () => {
    renderRoute('/login', { store: anonymousStore() })

    expect(
      await screen.findByRole('heading', { level: 2, name: authTexts.brandPanel.title }),
    ).toBeInTheDocument()
  })

  it('tem um h1 com o título e ele vem antes do painel no DOM', async () => {
    renderRoute('/login', { store: anonymousStore() })

    const h1 = await screen.findByRole('heading', { level: 1, name: 'Entrar' })
    const panel = screen.getByRole('heading', { level: 2, name: authTexts.brandPanel.title })
    expect(h1.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
  it('o admin entra direto na gestão de usuários, sem passar pela trilha', async () => {
    server.use(http.post('/api/v1/auth/login', () => HttpResponse.json({ ...tokens, user: admin })))
    const user = userEvent.setup()
    const { router } = renderRoute('/login', { store: anonymousStore() })
    const visited: string[] = []
    const unsubscribe = router.subscribe((state) => visited.push(state.location.pathname))

    await user.type(await screen.findByLabelText('E-mail'), 'admin@devready.local')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Usuários' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin/users')
    expect(visited).not.toContain('/track')
    unsubscribe()
  })
})
