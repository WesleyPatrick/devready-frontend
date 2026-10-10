import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { renderRoute } from '@/test/render'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { admin, candidate } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { passwordConflict } from '@/test/problem'
import { server } from '@/test/server'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { setReducedMotionForTests } from '@/lib/motion/reducedMotion'
import { authTexts } from './texts'
import type { CurrentUser } from './types'

function signedIn(user: CurrentUser = candidate) {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'a', user }))
  return store
}

function fieldBlock(label: string) {
  const block = screen.getByLabelText(label).closest('div.space-y-1')
  if (!(block instanceof HTMLElement)) throw new Error(`bloco do campo ${label} não encontrado`)
  return within(block)
}

describe('ProfilePage', () => {
  afterEach(() => refreshTokenStorage.clear())

  it('salva nome e mostra confirmação', async () => {
    const store = signedIn()
    const user = userEvent.setup()
    renderRoute('/profile', { store })

    const name = await screen.findByLabelText('Nome')
    await user.clear(name)
    await user.type(name, 'Ana Souza')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument()
    expect(store.getState().auth.user?.displayName).toBe('Ana Souza')
  })

  it('mostra o objetivo com os monogramas das empresas e o atalho para editar', async () => {
    renderRoute('/profile', { store: signedIn() })

    const goal = await screen.findByRole('region', { name: 'Seu objetivo' })
    expect(within(goal).getByText('Nubank')).toBeInTheDocument()
    expect(within(goal).getByText('Google')).toBeInTheDocument()
    expect(within(goal).getByText('Nu')).toBeInTheDocument()
    expect(within(goal).getByText('G')).toBeInTheDocument()
    expect(within(goal).getByRole('link', { name: 'Editar objetivo' })).toHaveAttribute(
      'href',
      '/onboarding?edit=1',
    )
  })

  it('oferece definir senha para conta social, sem pedir a senha atual, e lista provedores', async () => {
    const store = signedIn({ ...candidate, hasPassword: false, providers: ['GOOGLE'] })
    renderRoute('/profile', { store })

    expect(await screen.findByLabelText('Definir senha')).toBeInTheDocument()
    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument()
    const linked = screen.getByRole('region', { name: 'Contas vinculadas' })
    expect(within(linked).getByText('Google')).toBeInTheDocument()
    expect(screen.queryByText('GOOGLE')).not.toBeInTheDocument()
  })

  it('troca a senha com a senha atual e pede para entrar de novo', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.patch('/api/v1/me', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...candidate, hasPassword: true })
      }),
    )
    const store = signedIn()
    refreshTokenStorage.set('refresh-1')
    const user = userEvent.setup()
    const { router } = renderRoute('/profile', { store })

    await user.type(await screen.findByLabelText('Senha atual'), 'senha-forte')
    await user.type(screen.getByLabelText('Nova senha'), 'nova-senha-1')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Senha alterada. Entre com a senha nova.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?notice=password-changed')
    expect(router.state.historyAction).toBe('REPLACE')
    expect(store.getState().auth).toMatchObject({ status: 'anonymous', user: null })
    expect(refreshTokenStorage.get()).toBeNull()
    expect(body).toMatchObject({ currentPassword: 'senha-forte', newPassword: 'nova-senha-1' })
  })

  it('o 409 da troca que correu com um reset encerra a sessão e leva ao login com o detail', async () => {
    server.use(http.patch('/api/v1/me', passwordConflict))
    const store = signedIn()
    refreshTokenStorage.set('refresh-1')
    const user = userEvent.setup()
    const { router } = renderRoute('/profile', { store })

    await user.type(await screen.findByLabelText('Senha atual'), 'senha-forte')
    await user.type(screen.getByLabelText('Nova senha'), 'nova-senha-1')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText('Sua senha foi alterada por outro caminho. Entre de novo.'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?notice=password-conflict')
    expect(store.getState().auth).toMatchObject({ status: 'anonymous', user: null })
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('mostra junto ao campo a senha atual incorreta', async () => {
    const store = signedIn()
    refreshTokenStorage.set('refresh-1')
    const user = userEvent.setup()
    const { router } = renderRoute('/profile', { store })

    await user.type(await screen.findByLabelText('Senha atual'), 'errada')
    await user.type(screen.getByLabelText('Nova senha'), 'nova-senha-1')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await fieldBlock('Senha atual').findByText('Senha atual incorreta.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveAccessibleDescription(
      /Senha atual incorreta\./,
    )
    expect(router.state.location.pathname).toBe('/profile')
    expect(store.getState().auth.status).toBe('authenticated')
    expect(refreshTokenStorage.get()).toBe('refresh-1')
  })

  it('pede a senha atual antes de enviar a troca', async () => {
    let calls = 0
    server.use(
      http.patch('/api/v1/me', () => {
        calls += 1
        return HttpResponse.json(candidate)
      }),
    )
    const store = signedIn()
    const user = userEvent.setup()
    renderRoute('/profile', { store })

    await user.type(await screen.findByLabelText('Nova senha'), 'nova-senha-1')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await fieldBlock('Senha atual').findByText('Informe a senha atual.')).toBeInTheDocument()
    expect(calls).toBe(0)
  })

  it('não pede a senha atual para salvar só o nome', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.patch('/api/v1/me', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(candidate)
      }),
    )
    const store = signedIn()
    const user = userEvent.setup()
    renderRoute('/profile', { store })

    await user.click(await screen.findByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument()
    expect(body).not.toHaveProperty('currentPassword')
    expect(body).not.toHaveProperty('newPassword')
  })

  it('conta social que define senha também entra de novo', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.patch('/api/v1/me', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...candidate, hasPassword: true, providers: ['GOOGLE'] })
      }),
    )
    const store = signedIn({ ...candidate, hasPassword: false, providers: ['GOOGLE'] })
    refreshTokenStorage.set('refresh-1')
    const user = userEvent.setup()
    const { router } = renderRoute('/profile', { store })

    await user.type(await screen.findByLabelText('Definir senha'), 'nova-senha-1')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Senha alterada. Entre com a senha nova.')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?notice=password-changed')
    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBeNull()
    expect(body).not.toHaveProperty('currentPassword')
  })

  it('mostra junto ao campo o erro de nome vindo da API (422)', async () => {
    server.use(
      http.patch('/api/v1/me', () =>
        problem(422, 'Dados inválidos', 'Confira os campos.', [
          { field: 'displayName', message: 'Nome muito longo.' },
        ]),
      ),
    )
    const store = signedIn()
    const user = userEvent.setup()
    renderRoute('/profile', { store })

    await screen.findByLabelText('Nome')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await fieldBlock('Nome').findByText('Nome muito longo.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mostra junto ao campo o erro de senha vindo da API (422)', async () => {
    server.use(
      http.patch('/api/v1/me', () =>
        problem(422, 'Dados inválidos', 'Confira os campos.', [
          { field: 'newPassword', message: 'A senha pode ter no máximo 72 caracteres.' },
        ]),
      ),
    )
    const store = signedIn()
    const user = userEvent.setup()
    renderRoute('/profile', { store })

    await user.type(await screen.findByLabelText('Senha atual'), 'senha-forte')
    await user.type(screen.getByLabelText('Nova senha'), 'nova-senha-1')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await fieldBlock('Nova senha').findByText('A senha pode ter no máximo 72 caracteres.'),
    ).toBeInTheDocument()
    expect(store.getState().auth.status).toBe('authenticated')
  })

  it('mostra no alerta o erro de um campo que o formulário não tem', async () => {
    server.use(
      http.patch('/api/v1/me', () =>
        problem(422, 'Dados inválidos', 'Confira os campos.', [
          { field: 'bio', message: 'Bio inválida.' },
        ]),
      ),
    )
    const store = signedIn()
    const user = userEvent.setup()
    renderRoute('/profile', { store })

    await screen.findByLabelText('Nome')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Bio inválida.')
  })

  it('avisa quando não consegue falar com o servidor', async () => {
    server.use(http.patch('/api/v1/me', () => HttpResponse.error()))
    const store = signedIn()
    const user = userEvent.setup()
    renderRoute('/profile', { store })

    await screen.findByLabelText('Nome')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível falar com o servidor. Tente de novo.',
    )
  })

  it('sair de todos os dispositivos encerra a sessão', async () => {
    let logoutAllAuthorization: string | null = null
    let singleLogoutCalls = 0
    server.use(
      http.post('/api/v1/auth/logout-all', ({ request }) => {
        logoutAllAuthorization = request.headers.get('Authorization')
        return new HttpResponse(null, { status: 204 })
      }),
      http.post('/api/v1/auth/logout', () => {
        singleLogoutCalls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const store = signedIn()
    refreshTokenStorage.set('refresh-1')
    const user = userEvent.setup()
    const { router } = renderRoute('/profile', { store })

    await user.click(await screen.findByRole('button', { name: 'Sair de todos os dispositivos' }))

    await waitFor(() => expect(store.getState().auth.status).toBe('anonymous'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(refreshTokenStorage.get()).toBeNull()
    expect(logoutAllAuthorization).toBe('Bearer a')
    expect(singleLogoutCalls).toBe(0)
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('liga o erro de validação ao campo para leitores de tela', async () => {
    const store = signedIn()
    const user = userEvent.setup()
    renderRoute('/profile', { store })

    const name = await screen.findByRole('textbox', { name: 'Nome' })
    await user.clear(name)
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'))
    expect(name).toHaveAccessibleDescription('Informe seu nome.')
    expect(screen.getByRole('textbox', { name: 'URL do avatar' })).toHaveAccessibleDescription(
      'Opcional. Um link para uma imagem.',
    )
  })

  it('mostra o objetivo de carreira com link para editar', async () => {
    renderRoute('/profile', { store: signedIn() })

    expect(await screen.findByRole('heading', { name: 'Seu objetivo' })).toBeInTheDocument()
    expect(await screen.findByText('Nubank')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar objetivo' })).toHaveAttribute(
      'href',
      '/onboarding?edit=1',
    )
  })

  it('tem um h1 com o título da página', async () => {
    renderRoute('/profile', { store: signedIn() })

    expect(await screen.findByRole('heading', { level: 1, name: 'Perfil' })).toBeInTheDocument()
  })

  it('ao salvar, o botão vira "Salvo" por 1,5 s e volta a "Salvar"', async () => {
    renderRoute('/profile', { store: signedIn() })
    const button = await screen.findByRole('button', { name: authTexts.profile.save })

    const env = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const actEnvironment = env.IS_REACT_ACT_ENVIRONMENT
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      fireEvent.click(button)
      env.IS_REACT_ACT_ENVIRONMENT = false
      await vi.waitFor(() =>
        expect(screen.getByRole('button', { name: 'Salvo' })).toHaveClass('bg-easy'),
      )
      env.IS_REACT_ACT_ENVIRONMENT = actEnvironment
      expect(screen.getByText('Perfil atualizado.')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(1400))
      expect(screen.getByRole('button', { name: 'Salvo' })).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(200))
      expect(screen.getByRole('button', { name: authTexts.profile.save })).not.toHaveClass(
        'bg-easy',
      )
    } finally {
      env.IS_REACT_ACT_ENVIRONMENT = actEnvironment
      vi.useRealTimers()
    }
  })

  it('uma gravação que falha logo depois de uma que deu certo não mostra "Salvo"', async () => {
    const user = userEvent.setup()
    renderRoute('/profile', { store: signedIn() })

    await user.click(await screen.findByRole('button', { name: authTexts.profile.save }))
    const button = await screen.findByRole('button', { name: 'Salvo' })
    server.use(http.patch('/api/v1/me', () => HttpResponse.error()))
    await user.click(button)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível falar com o servidor. Tente de novo.',
    )
    expect(screen.queryByRole('button', { name: 'Salvo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: authTexts.profile.save })).not.toHaveClass('bg-easy')
    expect(screen.queryByText('Perfil atualizado.')).not.toBeInTheDocument()
  })

  it('com movimento, o certo do "Salvo" é desenhado', async () => {
    setReducedMotionForTests(false)
    const user = userEvent.setup()
    renderRoute('/profile', { store: signedIn() })

    await user.click(await screen.findByRole('button', { name: authTexts.profile.save }))

    const check = (await screen.findByRole('button', { name: 'Salvo' })).querySelector('svg')
    expect(check).toHaveClass('lucide-check', '[&>*]:animate-draw', '[&>*]:[stroke-dasharray:64]')
    expect(check).toHaveClass('motion-reduce:[&>*]:animate-none')
  })

  it('se o servidor falha, o botão treme e o foco continua nele', async () => {
    setReducedMotionForTests(false)
    server.use(http.patch('/api/v1/me', () => HttpResponse.error()))
    const user = userEvent.setup()
    renderRoute('/profile', { store: signedIn() })

    const button = await screen.findByRole('button', { name: authTexts.profile.save })
    await user.click(button)

    await waitFor(() => expect(button).toHaveClass('animate-shake'))
    expect(button).toHaveFocus()
    fireEvent.animationEnd(button)
    expect(button).not.toHaveClass('animate-shake')
  })

  it('falhar de novo, antes de a tremida acabar, faz o botão tremer de novo', async () => {
    setReducedMotionForTests(false)
    let answered: Promise<void> = Promise.resolve()
    server.use(
      http.patch('/api/v1/me', async () => {
        await answered
        return HttpResponse.error()
      }),
    )
    const user = userEvent.setup()
    renderRoute('/profile', { store: signedIn() })

    const button = await screen.findByRole('button', { name: authTexts.profile.save })
    await user.click(button)
    await waitFor(() => expect(button).toHaveClass('animate-shake'))

    let release = () => {}
    answered = new Promise<void>((resolve) => (release = resolve))
    await user.click(button)
    await screen.findByRole('button', { name: authTexts.profile.saving })
    expect(button).not.toHaveClass('animate-shake')
    release()
    await waitFor(() => expect(button).toHaveClass('animate-shake'))
  })

  it('enquanto grava, o botão fica com aria-disabled e um clique a mais não grava de novo', async () => {
    let release = () => {}
    const answered = new Promise<void>((resolve) => (release = resolve))
    let calls = 0
    server.use(
      http.patch('/api/v1/me', async () => {
        calls += 1
        await answered
        return HttpResponse.json(candidate)
      }),
    )
    const user = userEvent.setup()
    renderRoute('/profile', { store: signedIn() })

    await user.click(await screen.findByRole('button', { name: authTexts.profile.save }))

    const button = await screen.findByRole('button', { name: authTexts.profile.saving })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toBeEnabled()
    expect(button.querySelector('svg.animate-spin')).toHaveClass('motion-reduce:animate-none')
    await user.click(button)
    expect(calls).toBe(1)

    release()
    expect(await screen.findByText('Perfil atualizado.')).toBeInTheDocument()
  })
  it('o admin vê a conta sem a seção do objetivo, e o objetivo nem é pedido', async () => {
    const asked: string[] = []
    const listen = ({ request }: { request: Request }) => {
      if (new URL(request.url).pathname.startsWith('/api/v1/career/')) asked.push(request.url)
    }
    server.events.on('request:start', listen)
    try {
      renderRoute('/profile', { store: signedIn(admin) })

      expect(await screen.findByRole('region', { name: 'Sua conta' })).toBeInTheDocument()
      expect(screen.getByLabelText('Nome')).toHaveValue('Administrador')
      expect(screen.queryByRole('region', { name: 'Seu objetivo' })).not.toBeInTheDocument()
      expect(asked).toEqual([])
    } finally {
      server.events.removeListener('request:start', listen)
    }
  })
})
