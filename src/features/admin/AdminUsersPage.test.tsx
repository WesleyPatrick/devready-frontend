import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { adminUser, BRUNO_ID, DAVI_ID, ELIS_ID, revokedSessions } from '@/test/admin'
import { admin } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { adminStore, renderRoute } from '@/test/render'
import { server } from '@/test/server'

const CAPTION = 'Usuários da plataforma'

async function renderUsers(path = '/admin/users') {
  const result = renderRoute(path, { store: adminStore() })
  await screen.findByRole('heading', { level: 1, name: 'Usuários' })
  await screen.findByRole('table', { name: CAPTION })
  return { user: userEvent.setup(), ...result }
}

function dataRows() {
  return within(screen.getByRole('table', { name: CAPTION }))
    .getAllByRole('row')
    .slice(1)
}

function rowOf(name: string) {
  const row = dataRows().find((candidate) => candidate.textContent?.includes(name))
  if (!row) throw new Error(`linha de ${name} não encontrada`)
  return row
}

const actionsOf = (name: string) =>
  within(rowOf(name)).getByRole('button', { name: `Ações para ${name}` })

async function choose(user: ReturnType<typeof userEvent.setup>, name: string, action: string) {
  await user.click(actionsOf(name))
  await user.click(await screen.findByRole('menuitem', { name: action }))
}

const NO_ACCESS = 'Você não tem mais acesso à gestão de usuários.'
const PESSOA_01 = 'b0000000-0000-4000-8000-000000000001'

const updatingRegion = () =>
  within(
    screen.getByRole('searchbox', { name: 'Buscar por nome ou e-mail' }).closest('label')!
      .parentElement!,
  ).getByRole('status')

const dialogGone = () => waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

describe('AdminUsersPage', () => {
  it('lista 20 por página, do cadastro mais novo, e a própria conta sem ações', async () => {
    const { user, router } = await renderUsers()

    await waitFor(() => expect(dataRows()).toHaveLength(20))
    expect(dataRows()[0]).toHaveTextContent('Elis Teste')
    expect(within(rowOf('Elis Teste')).getByText('Ativa')).toBeInTheDocument()
    expect(within(rowOf('Elis Teste')).getByText('Senha e Google')).toBeInTheDocument()
    expect(within(rowOf('Davi Desafio')).getByText('GitHub')).toBeInTheDocument()
    expect(within(rowOf('Carla Desafio')).getByText('Desativada')).toBeInTheDocument()
    expect(within(rowOf('Bruno Admin')).getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima página' }))

    await waitFor(() => expect(dataRows()).toHaveLength(4))
    expect(router.state.location.search).toBe('?page=2')
    const mine = rowOf('Administrador')
    expect(within(mine).getByText('Você')).toBeInTheDocument()
    expect(within(mine).queryByRole('button')).not.toBeInTheDocument()
    expect(actionsOf('Pessoa 19')).toBeInTheDocument()
  })

  it('a busca espera a pessoa parar de digitar, ignora maiúsculas e vai para a URL', async () => {
    const { user, router } = await renderUsers()
    const search = screen.getByRole('searchbox', { name: 'Buscar por nome ou e-mail' })

    await user.type(search, 'SESSAO')

    await waitFor(() => expect(dataRows()).toHaveLength(1))
    expect(dataRows()[0]).toHaveTextContent('Elis Teste')
    expect(router.state.location.search).toBe('?q=SESSAO')

    await user.clear(search)

    await waitFor(() => expect(dataRows()).toHaveLength(20))
    expect(router.state.location.search).toBe('')
  })

  it('filtra por papel e por situação, e diz quando nada passa', async () => {
    const { user, router } = await renderUsers()

    await user.click(screen.getByRole('button', { name: 'Papel' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Admins' }))
    await waitFor(() => expect(dataRows()).toHaveLength(2))
    expect(router.state.location.search).toBe('?role=ADMIN')

    await user.click(screen.getByRole('button', { name: 'Situação' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Desativadas' }))

    expect(await screen.findByText('Nenhum usuário com esses filtros.')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?role=ADMIN&active=false')
  })

  it('desativar pede confirmação com o efeito, grava, avisa e devolve o foco ao menu da linha', async () => {
    const { user } = await renderUsers()

    await choose(user, 'Elis Teste', 'Desativar')
    const dialog = await screen.findByRole('dialog', { name: 'Desativar Elis Teste?' })
    expect(
      within(dialog).getByText(
        'A pessoa não consegue entrar até ser reativada. A sessão dela deixa de ser renovada na hora, e o acesso já aberto vale por até 15 minutos.',
      ),
    ).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Desativar' }))

    await dialogGone()
    await waitFor(() =>
      expect(within(rowOf('Elis Teste')).getByText('Desativada')).toBeInTheDocument(),
    )
    expect(screen.getByText('Conta de Elis Teste desativada.')).toBeInTheDocument()
    expect(adminUser(ELIS_ID).active).toBe(false)
    expect(revokedSessions()).toEqual([ELIS_ID])
    await waitFor(() => expect(actionsOf('Elis Teste')).toHaveFocus())
  })

  it('Esc fecha a confirmação sem gravar e devolve o foco ao menu da linha', async () => {
    const { user } = await renderUsers()

    await choose(user, 'Davi Desafio', 'Tornar admin')
    await screen.findByRole('dialog', { name: 'Tornar Davi Desafio admin?' })
    await user.keyboard('{Escape}')

    await dialogGone()
    expect(adminUser(DAVI_ID).role).toBe('CANDIDATE')
    await waitFor(() => expect(actionsOf('Davi Desafio')).toHaveFocus())
  })

  it('tornar admin e depois candidato troca o papel e o item do menu', async () => {
    const { user } = await renderUsers()

    await choose(user, 'Davi Desafio', 'Tornar admin')
    const promote = await screen.findByRole('dialog', { name: 'Tornar Davi Desafio admin?' })
    await user.click(within(promote).getByRole('button', { name: 'Tornar admin' }))
    await dialogGone()
    await waitFor(() =>
      expect(within(rowOf('Davi Desafio')).getByText('Admin')).toBeInTheDocument(),
    )
    expect(adminUser(DAVI_ID).role).toBe('ADMIN')
    expect(revokedSessions()).toEqual([])

    await choose(user, 'Davi Desafio', 'Tornar candidato')
    const demote = await screen.findByRole('dialog', { name: 'Tornar Davi Desafio candidato?' })
    await user.click(within(demote).getByRole('button', { name: 'Tornar candidato' }))
    await dialogGone()
    await waitFor(() =>
      expect(within(rowOf('Davi Desafio')).getByText('Candidato')).toBeInTheDocument(),
    )
    expect(adminUser(DAVI_ID).role).toBe('CANDIDATE')
  })

  it('o 422 da API aparece como aviso dentro da confirmação, que fica aberta', async () => {
    server.use(
      http.patch('/api/v1/admin/users/:id', () =>
        problem(422, 'Dados inválidos', 'O sistema precisa de ao menos um admin ativo.'),
      ),
    )
    const { user } = await renderUsers()

    await choose(user, 'Bruno Admin', 'Tornar candidato')
    const dialog = await screen.findByRole('dialog', { name: 'Tornar Bruno Admin candidato?' })
    await user.click(within(dialog).getByRole('button', { name: 'Tornar candidato' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'O sistema precisa de ao menos um admin ativo.',
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await dialogGone()
    expect(within(rowOf('Bruno Admin')).getByText('Admin')).toBeInTheDocument()
    expect(adminUser(BRUNO_ID).role).toBe('ADMIN')
  })

  it('erro ao carregar mostra o aviso com nova tentativa', async () => {
    server.use(
      http.get('/api/v1/admin/users', () => problem(500, 'Erro', 'Falhou.'), { once: true }),
    )
    const user = userEvent.setup()
    renderRoute('/admin/users', { store: adminStore() })

    const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
    expect(screen.getByText('Não foi possível carregar os usuários.')).toBeInTheDocument()
    await user.click(retry)

    expect(await screen.findByRole('table', { name: CAPTION })).toBeInTheDocument()
  })

  it('quem deixou de ser admin ativo vê o aviso no lugar da tabela, sem nova tentativa', async () => {
    adminUser(admin.id).role = 'CANDIDATE'
    renderRoute('/admin/users', { store: adminStore() })

    expect(await screen.findByText(NO_ACCESS)).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: CAPTION })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument()
    expect(screen.queryByText('Não foi possível carregar os usuários.')).not.toBeInTheDocument()
  })

  it('o 403 da mudança aparece na confirmação, e a lista dá lugar ao aviso', async () => {
    const { user } = await renderUsers()
    adminUser(admin.id).active = false

    await choose(user, 'Elis Teste', 'Desativar')
    const dialog = await screen.findByRole('dialog', { name: 'Desativar Elis Teste?' })
    await user.click(within(dialog).getByRole('button', { name: 'Desativar' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(NO_ACCESS)
    expect(adminUser(ELIS_ID).active).toBe(true)
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await dialogGone()
    expect(await screen.findByText(NO_ACCESS)).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: CAPTION })).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('searchbox', { name: 'Buscar por nome ou e-mail' })).toHaveFocus(),
    )
  })

  it('depois do 403, trocar um filtro não traz a lista antiga de volta', async () => {
    const { user } = await renderUsers()
    adminUser(admin.id).active = false
    await user.click(screen.getByRole('button', { name: 'Papel' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Admins' }))
    expect(await screen.findByText(NO_ACCESS)).toBeInTheDocument()

    let started = false
    let release = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.get(
        '/api/v1/admin/users',
        async () => {
          started = true
          await gate
        },
        { once: true },
      ),
    )
    await user.click(screen.getByRole('button', { name: 'Situação' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Desativadas' }))
    await waitFor(() => expect(started).toBe(true))

    expect(screen.queryByRole('table', { name: CAPTION })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Ações para / })).not.toBeInTheDocument()
    expect(screen.getByText(NO_ACCESS)).toBeInTheDocument()
    release()
  })

  it('a região "Atualizando…" fica montada e só troca o texto', async () => {
    let release = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const { user } = await renderUsers()
    const updating = updatingRegion()
    expect(updating).toBeEmptyDOMElement()
    server.use(
      http.get(
        '/api/v1/admin/users',
        async () => {
          await gate
        },
        { once: true },
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Papel' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Admins' }))
    await waitFor(() => expect(updating).toHaveTextContent('Atualizando…'))
    release()

    await waitFor(() => expect(dataRows()).toHaveLength(2))
    expect(updating).toBeInTheDocument()
    expect(updating).toBeEmptyDOMElement()
  })

  it('o mesmo aviso de sucesso duas vezes seguidas é anunciado de novo', async () => {
    adminUser(PESSOA_01).displayName = 'Elis Teste'
    const { user } = await renderUsers()

    await choose(user, 'Elis Teste', 'Desativar')
    let dialog = await screen.findByRole('dialog', { name: 'Desativar Elis Teste?' })
    await user.click(within(dialog).getByRole('button', { name: 'Desativar' }))
    await dialogGone()
    const first = await screen.findByText('Conta de Elis Teste desativada.')

    await user.click(document.querySelector<HTMLElement>(`[data-user-id="${PESSOA_01}"]`)!)
    await user.click(await screen.findByRole('menuitem', { name: 'Desativar' }))
    dialog = await screen.findByRole('dialog', { name: 'Desativar Elis Teste?' })
    await user.click(within(dialog).getByRole('button', { name: 'Desativar' }))
    await dialogGone()

    await waitFor(() => expect(first).not.toBeInTheDocument())
    expect(screen.getByText('Conta de Elis Teste desativada.')).toBeInTheDocument()
    expect(adminUser(PESSOA_01).active).toBe(false)
  })

  describe('com avatar de outra pessoa', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('carrega a imagem sem mandar o referer da gestão', async () => {
      const requested: string[] = []
      class LoadedImage extends EventTarget {
        complete = true
        naturalWidth = 1
        crossOrigin: string | null = null
        private policy = ''
        get referrerPolicy() {
          return this.policy
        }
        set referrerPolicy(value: string) {
          this.policy = value
        }
        set src(value: string) {
          requested.push(`${value} ${this.policy}`)
        }
      }
      vi.stubGlobal('Image', LoadedImage)
      adminUser(ELIS_ID).avatarUrl = 'https://avatars.example.com/elis.png'

      const { container } = await renderUsers()

      await waitFor(() =>
        expect(
          container.querySelector('img[src="https://avatars.example.com/elis.png"]'),
        ).not.toBeNull(),
      )
      const image = container.querySelector('img[src="https://avatars.example.com/elis.png"]')!
      expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')
      expect(requested).toContain('https://avatars.example.com/elis.png no-referrer')
    })
  })
})
