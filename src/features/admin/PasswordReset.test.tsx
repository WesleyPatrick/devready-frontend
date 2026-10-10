import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import {
  adminUser,
  DAVI_ID,
  ELIS_ID,
  issuedPasswords,
  mustChangePassword,
  revokedSessions,
} from '@/test/admin'
import { admin } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { adminStore, renderRoute } from '@/test/render'
import { server } from '@/test/server'

const CAPTION = 'Usuários da plataforma'
const ACTION = 'Gerar senha provisória'
const NO_ACCESS = 'Você não tem mais acesso à gestão de usuários.'

async function renderUsers(path = '/admin/users') {
  const result = renderRoute(path, { store: adminStore() })
  await screen.findByRole('table', { name: CAPTION })
  return { user: userEvent.setup(), ...result }
}

function rowOf(name: string) {
  const row = within(screen.getByRole('table', { name: CAPTION }))
    .getAllByRole('row')
    .find((candidate) => candidate.textContent?.includes(name))
  if (!row) throw new Error(`linha de ${name} não encontrada`)
  return row
}

const actionsOf = (name: string) =>
  within(rowOf(name)).getByRole('button', { name: `Ações para ${name}` })

async function generate(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(actionsOf(name))
  await user.click(await screen.findByRole('menuitem', { name: ACTION }))
  const confirmation = await screen.findByRole('dialog', {
    name: `Gerar uma senha provisória para ${name}?`,
  })
  await user.click(within(confirmation).getByRole('button', { name: ACTION }))
  return screen.findByRole('dialog', { name: `Senha provisória de ${name}` })
}

const dialogGone = () => waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

describe('senha provisória na gestão de usuários', () => {
  it('a ação fica no menu das outras contas e não aparece na própria', async () => {
    const { user } = await renderUsers()

    await user.click(actionsOf('Elis Teste'))
    expect(await screen.findByRole('menuitem', { name: ACTION })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    await waitFor(() => expect(rowOf('Administrador')).toBeInTheDocument())
    expect(within(rowOf('Administrador')).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: ACTION })).not.toBeInTheDocument()
  })

  it('pede confirmação com o efeito e mostra a senha uma vez, sem guardá-la no store nem na URL', async () => {
    const { user, store, router } = await renderUsers()

    await user.click(actionsOf('Elis Teste'))
    await user.click(await screen.findByRole('menuitem', { name: ACTION }))
    const confirmation = await screen.findByRole('dialog', {
      name: 'Gerar uma senha provisória para Elis Teste?',
    })
    expect(
      within(confirmation).getByText(
        'A sessão dela deixa de ser renovada na hora, e o acesso já aberto vale por até 15 minutos. No próximo acesso, ela terá de criar uma senha nova.',
      ),
    ).toBeInTheDocument()
    await user.click(within(confirmation).getByRole('button', { name: ACTION }))

    const dialog = await screen.findByRole('dialog', { name: 'Senha provisória de Elis Teste' })
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Copiar' })).toHaveFocus(),
    )
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    const [password] = issuedPasswords()
    expect(within(dialog).getByText(password)).toHaveClass('font-mono')
    expect(
      within(dialog).getByText(
        'Esta senha não aparece de novo. Passe-a à pessoa por um canal seguro.',
      ),
    ).toBeInTheDocument()
    expect(mustChangePassword(ELIS_ID)).toBe(true)
    expect(revokedSessions()).toEqual([ELIS_ID])
    expect(JSON.stringify(store.getState())).not.toContain(password)
    expect(router.state.location.pathname + router.state.location.search).not.toContain(password)
  })

  it('"Copiar" põe a senha na área de transferência e avisa "Copiada"', async () => {
    const { user } = await renderUsers()
    const dialog = await generate(user, 'Elis Teste')

    await user.click(within(dialog).getByRole('button', { name: 'Copiar' }))

    expect(await navigator.clipboard.readText()).toBe(issuedPasswords()[0])
    expect(within(dialog).getByRole('button', { name: 'Copiada' })).toBeInTheDocument()
    expect(within(dialog).getByRole('status')).toHaveTextContent('Senha copiada.')
  })

  it('sem acesso à área de transferência, pede para copiar à mão', async () => {
    const { user } = await renderUsers()
    const dialog = await generate(user, 'Elis Teste')
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('negado'))

    await user.click(within(dialog).getByRole('button', { name: 'Copiar' }))

    expect(
      await within(dialog).findByText('Não foi possível copiar. Selecione a senha e copie à mão.'),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
  })

  it('"Fechar" esquece a senha e devolve o foco ao menu da linha', async () => {
    const { user, store } = await renderUsers()
    const dialog = await generate(user, 'Elis Teste')
    const [first] = issuedPasswords()

    await user.click(within(dialog).getByRole('button', { name: 'Fechar' }))

    await dialogGone()
    expect(screen.queryByText(first)).not.toBeInTheDocument()
    expect(JSON.stringify(store.getState())).not.toContain(first)
    await waitFor(() => expect(actionsOf('Elis Teste')).toHaveFocus())

    const next = await generate(user, 'Davi Desafio')
    const second = issuedPasswords()[1]
    expect(within(next).getByText(second)).toBeInTheDocument()
    expect(within(next).queryByText(first)).not.toBeInTheDocument()
    expect(adminUser(DAVI_ID).hasPassword).toBe(true)
    await user.keyboard('{Escape}')
    await dialogGone()
    expect(screen.queryByText(second)).not.toBeInTheDocument()
    await waitFor(() =>
      expect(within(rowOf('Davi Desafio')).getByText('Senha e GitHub')).toBeInTheDocument(),
    )
    await waitFor(() => expect(actionsOf('Davi Desafio')).toHaveFocus())
  })

  it('o 404 e o 422 aparecem dentro da confirmação, que fica aberta', async () => {
    server.use(
      http.post(
        '/api/v1/admin/users/:id/password-reset',
        () => problem(404, 'Não encontrado', 'Usuário não encontrado.'),
        { once: true },
      ),
      http.post(
        '/api/v1/admin/users/:id/password-reset',
        () =>
          problem(422, 'Dados inválidos', 'Você não pode alterar a sua própria conta por aqui.'),
        { once: true },
      ),
    )
    const { user } = await renderUsers()

    await user.click(actionsOf('Elis Teste'))
    await user.click(await screen.findByRole('menuitem', { name: ACTION }))
    const confirmation = await screen.findByRole('dialog', {
      name: 'Gerar uma senha provisória para Elis Teste?',
    })
    await user.click(within(confirmation).getByRole('button', { name: ACTION }))
    expect(await within(confirmation).findByRole('alert')).toHaveTextContent(
      'Usuário não encontrado.',
    )

    await user.click(within(confirmation).getByRole('button', { name: ACTION }))
    await waitFor(() =>
      expect(within(confirmation).getByRole('alert')).toHaveTextContent(
        'Você não pode alterar a sua própria conta por aqui.',
      ),
    )
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(issuedPasswords()).toEqual([])

    await user.click(within(confirmation).getByRole('button', { name: 'Cancelar' }))
    await dialogGone()
    expect(mustChangePassword(ELIS_ID)).toBe(false)
    await waitFor(() => expect(actionsOf('Elis Teste')).toHaveFocus())
  })

  it('o 403 aparece na confirmação, e a lista dá lugar ao aviso', async () => {
    const { user } = await renderUsers()
    adminUser(admin.id).active = false

    await user.click(actionsOf('Elis Teste'))
    await user.click(await screen.findByRole('menuitem', { name: ACTION }))
    const confirmation = await screen.findByRole('dialog', {
      name: 'Gerar uma senha provisória para Elis Teste?',
    })
    await user.click(within(confirmation).getByRole('button', { name: ACTION }))

    expect(await within(confirmation).findByRole('alert')).toHaveTextContent(NO_ACCESS)
    expect(mustChangePassword(ELIS_ID)).toBe(false)
    await user.click(within(confirmation).getByRole('button', { name: 'Cancelar' }))
    await dialogGone()
    expect(await screen.findByText(NO_ACCESS)).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: CAPTION })).not.toBeInTheDocument()
  })
})
