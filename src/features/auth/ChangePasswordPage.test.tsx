import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { makeStore } from '@/app/store'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { admin } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { passwordConflict } from '@/test/problem'
import { renderRoute } from '@/test/render'
import { server } from '@/test/server'
import type { UpdateProfileBody } from './api'
import { sessionStarted } from './slice'

const TEMPORARY = 'Provisoria000001'

function renderChange() {
  const store = makeStore()
  store.dispatch(
    sessionStarted({ accessToken: 'access-1', user: { ...admin, mustChangePassword: true } }),
  )
  refreshTokenStorage.set('refresh-1')
  const user = userEvent.setup()
  return { user, ...renderRoute('/change-password', { store }) }
}

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  values: { current?: string; next?: string; confirm?: string },
) {
  if (values.current)
    await user.type(await screen.findByLabelText('Senha provisória'), values.current)
  if (values.next) await user.type(screen.getByLabelText('Senha nova'), values.next)
  if (values.confirm)
    await user.type(screen.getByLabelText('Confirme a senha nova'), values.confirm)
  await user.click(screen.getByRole('button', { name: 'Salvar senha' }))
}

describe('ChangePasswordPage', () => {
  beforeEach(() => refreshTokenStorage.clear())

  it('explica a senha provisória, na moldura focada com o menu só com Sair', async () => {
    const { user } = renderChange()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Crie uma senha nova' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/senha atual é provisória/)).toBeInTheDocument()
    const header = screen.getByRole('banner')
    await user.click(within(header).getByRole('button', { name: 'Conta de Administrador' }))
    expect(await screen.findByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')).toHaveLength(1)
  })

  it('valida os campos como o cadastro, e a confirmação precisa ser igual', async () => {
    const { user } = renderChange()

    await fill(user, {})
    expect(await screen.findByText('Informe a senha provisória.')).toBeInTheDocument()
    expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres.')).toBeInTheDocument()

    await fill(user, { current: TEMPORARY, next: 'x'.repeat(73), confirm: 'x'.repeat(73) })
    expect(
      await screen.findByText(
        'A senha pode ter no máximo 72 bytes (letras com acento contam como 2).',
      ),
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Senha nova'))
    await user.clear(screen.getByLabelText('Confirme a senha nova'))
    await fill(user, { next: 'senha-nova-1', confirm: 'senha-nova-2' })
    expect(
      await screen.findByText('A confirmação precisa ser igual à senha nova.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Confirme a senha nova')).toHaveAttribute('aria-invalid', 'true')
  })

  it('grava pelo PATCH /me, encerra a sessão local e vai para o login com o aviso', async () => {
    let body: UpdateProfileBody | null = null
    server.use(
      http.patch('/api/v1/me', async ({ request }) => {
        body = (await request.json()) as UpdateProfileBody
        return HttpResponse.json({ ...admin, mustChangePassword: false })
      }),
    )
    const { user, store, router } = renderChange()

    await fill(user, { current: TEMPORARY, next: 'senha-nova-1', confirm: 'senha-nova-1' })

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?notice=password-changed')
    expect(await screen.findByText('Senha alterada. Entre com a senha nova.')).toBeInTheDocument()
    expect(body).toEqual({
      displayName: admin.displayName,
      avatarUrl: admin.avatarUrl,
      currentPassword: TEMPORARY,
      newPassword: 'senha-nova-1',
    })
    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('o 409 (a senha mudou por outro caminho) encerra a sessão e leva ao login com o detail', async () => {
    server.use(http.patch('/api/v1/me', passwordConflict))
    const { user, store, router } = renderChange()

    await fill(user, { current: TEMPORARY, next: 'senha-nova-1', confirm: 'senha-nova-1' })

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?notice=password-conflict')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Sua senha foi alterada por outro caminho. Entre de novo.',
    )
    expect(store.getState().auth.status).toBe('anonymous')
    expect(refreshTokenStorage.get()).toBeNull()
  })

  it('o 422 da senha igual à provisória aparece no campo da senha nova', async () => {
    server.use(
      http.patch('/api/v1/me', () =>
        problem(422, 'Dados inválidos', 'A senha nova precisa ser diferente da provisória.'),
      ),
    )
    const { user, router } = renderChange()

    await fill(user, { current: TEMPORARY, next: TEMPORARY, confirm: TEMPORARY })

    const message = await screen.findByText('A senha nova precisa ser diferente da provisória.')
    expect(screen.getByLabelText('Senha nova')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Senha nova').getAttribute('aria-describedby')).toContain(
      message.id,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/change-password')
  })

  it('a senha provisória errada aparece no campo dela', async () => {
    server.use(
      http.patch('/api/v1/me', () =>
        problem(422, 'Dados inválidos', 'Confira os campos informados.', [
          { field: 'currentPassword', message: 'Senha atual incorreta.' },
        ]),
      ),
    )
    const { user } = renderChange()

    await fill(user, { current: 'errada-123', next: 'senha-nova-1', confirm: 'senha-nova-1' })

    expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha provisória')).toHaveAttribute('aria-invalid', 'true')
  })

  it('sem resposta do servidor, avisa no alerta', async () => {
    server.use(http.patch('/api/v1/me', () => HttpResponse.error()))
    const { user } = renderChange()

    await fill(user, { current: TEMPORARY, next: 'senha-nova-1', confirm: 'senha-nova-1' })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível falar com o servidor. Tente de novo.',
    )
  })
})
