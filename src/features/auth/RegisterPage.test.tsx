import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { authTexts } from './texts'
import { server } from '@/test/server'
import { problem } from '@/test/handlers'
import { anonymousStore, renderRoute } from '@/test/render'

describe('RegisterPage', () => {
  it('cria a conta e entra', async () => {
    const user = userEvent.setup()
    const { store, router } = renderRoute('/register', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
  })

  it('mostra senha curta antes de enviar e e-mail duplicado vindo da API', async () => {
    server.use(
      http.post('/api/v1/auth/register', () =>
        problem(409, 'E-mail já cadastrado', 'Já existe uma conta com o e-mail ana@example.com.'),
      ),
    )
    const user = userEvent.setup()
    renderRoute('/register', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'curta')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(
      await screen.findByText('A senha precisa ter pelo menos 8 caracteres.'),
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Senha'))
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma conta')
  })

  it('mostra erros de campo vindos da API (422)', async () => {
    server.use(
      http.post('/api/v1/auth/register', () =>
        problem(422, 'Dados inválidos', 'Confira os campos.', [
          { field: 'displayName', message: 'Nome muito longo.' },
        ]),
      ),
    )
    const user = userEvent.setup()
    renderRoute('/register', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Nome muito longo.')).toBeInTheDocument()
  })

  it('não repete o setError em loop após um 422', async () => {
    server.use(
      http.post('/api/v1/auth/register', () =>
        problem(422, 'Dados inválidos', 'Confira os campos.', [
          { field: 'displayName', message: 'Nome muito longo.' },
        ]),
      ),
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    renderRoute('/register', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Nome muito longo.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Nome'), 'x')
    expect(await screen.findByDisplayValue('Anax')).toBeInTheDocument()
    const loopCalls = consoleError.mock.calls.filter((call) =>
      String(call[0]).includes('Maximum update depth'),
    )
    expect(loopCalls).toHaveLength(0)
    consoleError.mockRestore()
  })

  it('mostra no alerta o erro de um campo que o formulário não tem', async () => {
    server.use(
      http.post('/api/v1/auth/register', () =>
        problem(422, 'Dados inválidos', 'Confira os campos.', [
          { field: 'phone', message: 'Telefone inválido.' },
        ]),
      ),
    )
    const user = userEvent.setup()
    renderRoute('/register', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Telefone inválido.')
  })

  it('avisa quando não consegue falar com o servidor', async () => {
    server.use(http.post('/api/v1/auth/register', () => HttpResponse.error()))
    const user = userEvent.setup()
    renderRoute('/register', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível falar com o servidor. Tente de novo.',
    )
  })

  it('liga erro e dica aos campos para leitores de tela', async () => {
    const user = userEvent.setup()
    renderRoute('/register', { store: anonymousStore() })

    const password = await screen.findByLabelText('Senha')
    expect(password).not.toHaveAttribute('aria-invalid')
    expect(password).toHaveAccessibleDescription('Pelo menos 8 caracteres.')

    await user.type(password, 'curta')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    const name = await screen.findByRole('textbox', { name: 'Nome' })
    await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'))
    expect(name).toHaveAccessibleDescription('Informe seu nome.')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAccessibleDescription(
      'Pelo menos 8 caracteres. A senha precisa ter pelo menos 8 caracteres.',
    )
  })

  it('mostra o painel da marca ao lado do formulário', async () => {
    renderRoute('/register', { store: anonymousStore() })

    expect(
      await screen.findByRole('heading', { level: 2, name: authTexts.brandPanel.title }),
    ).toBeInTheDocument()
  })

  it('tem um h1 com o título e ele vem antes do painel no DOM', async () => {
    renderRoute('/register', { store: anonymousStore() })

    const h1 = await screen.findByRole('heading', { level: 1, name: 'Criar conta' })
    const panel = screen.getByRole('heading', { level: 2, name: authTexts.brandPanel.title })
    expect(h1.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('enquanto grava o cadastro, o botão mostra o ícone girando', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post('/api/v1/auth/register', async () => {
        await gate
        return problem(409, 'E-mail já cadastrado', 'Já existe uma conta.')
      }),
    )
    const user = userEvent.setup()
    renderRoute('/register', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    const sending = await screen.findByRole('button', { name: authTexts.register.submitting })
    expect(sending.querySelector('svg.animate-spin')).toHaveClass('motion-reduce:animate-none')
    release()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('enquanto grava, o botão fica com aria-disabled, guarda o foco e não envia de novo', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    let calls = 0
    server.use(
      http.post('/api/v1/auth/register', async () => {
        calls += 1
        await gate
        return problem(
          409,
          'E-mail já cadastrado',
          'Já existe uma conta com o e-mail ana@example.com.',
        )
      }),
    )
    const user = userEvent.setup()
    renderRoute('/register', { store: anonymousStore() })

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-forte')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    const sending = await screen.findByRole('button', { name: authTexts.register.submitting })
    expect(sending).toHaveAttribute('aria-disabled', 'true')
    expect(sending).toBeEnabled()
    expect(sending).toHaveFocus()
    await user.click(sending)
    await user.type(screen.getByLabelText('Senha'), '{Enter}')
    expect(calls).toBe(1)

    release()
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma conta')
    expect(calls).toBe(1)
  })
})
