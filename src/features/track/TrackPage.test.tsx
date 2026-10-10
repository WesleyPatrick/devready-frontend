import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import {
  candidate,
  careerProfile,
  competencyDetail,
  emptyTrack,
  track,
  trackWithProgress,
} from '@/test/fixtures'
import { problem, trackHandlers } from '@/test/handlers'
import { renderRoute } from '@/test/render'
import { server } from '@/test/server'

async function renderTrack(path = '/track') {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
  const result = renderRoute(path, { store })
  await screen.findByRole('navigation', { name: 'Navegação principal' })
  await screen.findByRole('heading', { level: 1, name: 'Sua trilha' })
  return { user: userEvent.setup(), ...result }
}

async function table() {
  return screen.findByRole('table', { name: 'Competências da trilha' })
}

function dataRows(element: HTMLElement) {
  return within(element).getAllByRole('row').slice(1)
}

async function expectRowCount(count: number) {
  await waitFor(() => expect(dataRows(screen.getByRole('table')).length).toBe(count))
}

describe('TrackPage', () => {
  it('mostra o título e o objetivo, sem etiqueta de prévia', async () => {
    await renderTrack()
    await table()
    expect(screen.getByRole('heading', { level: 1, name: 'Sua trilha' })).toBeInTheDocument()
    expect(screen.queryByText('Prévia')).not.toBeInTheDocument()
    const goal = screen.getByRole('heading', { level: 2, name: 'Seu objetivo' }).parentElement!
    expect(within(goal).getByText('Nubank')).toBeInTheDocument()
    expect(within(goal).getByText('Google')).toBeInTheDocument()
    expect(within(goal).getByText('Java e Spring')).toBeInTheDocument()
    expect(within(goal).getByText('Júnior')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar objetivo' })).toHaveAttribute(
      'href',
      '/onboarding?edit=1',
    )
    expect(screen.getByRole('region', { name: 'Seu progresso' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })

  it('mostra o anel, o título do plano e as vagas analisadas', async () => {
    await renderTrack()
    const ring = await screen.findByRole('progressbar', {
      name: '0 de 13 competências concluídas',
    })
    expect(ring).toHaveAttribute('aria-valuenow', '0')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Plano para Backend júnior' }),
    ).toBeInTheDocument()
    expect(screen.getByText('26 vagas analisadas')).toBeInTheDocument()
  })

  it('o cartão do plano não repete empresas, stack e senioridade da linha do objetivo', async () => {
    await renderTrack()
    const plan = (
      await screen.findByRole('heading', { level: 2, name: 'Plano para Backend júnior' })
    ).closest('section')!
    expect(within(plan).queryByText('Nubank')).not.toBeInTheDocument()
    expect(within(plan).queryByText('Google')).not.toBeInTheDocument()
    expect(within(plan).queryByText('Java e Spring')).not.toBeInTheDocument()
    expect(within(plan).queryByText('Júnior')).not.toBeInTheDocument()
    expect(within(plan).getByText('26 vagas analisadas')).toBeInTheDocument()
  })

  it('lista as 13 competências da API, com dificuldade e "pedido em" sobre as vagas da trilha', async () => {
    await renderTrack()
    const rows = dataRows(await table())
    expect(rows).toHaveLength(13)
    const sql = rows.find((row) => within(row).queryByText('SQL e modelagem de dados'))!
    expect(within(sql).getByText('Médio')).toBeInTheDocument()
    expect(within(sql).getByText('Pedido em 11 de 26 vagas')).toBeInTheDocument()
    expect(within(sql).getByText('11/26')).toHaveClass('font-mono')
  })

  it('erro ao carregar a trilha tem nova tentativa', async () => {
    server.use(
      http.get('/api/v1/career/track', () => problem(500, 'Erro', 'Falhou.'), { once: true }),
    )
    const { user } = await renderTrack()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a trilha.',
    )
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(dataRows(await table())).toHaveLength(13)
  })

  it('a competência bloqueada mostra a dificuldade sem a cor do nível', async () => {
    server.use(...trackHandlers(trackWithProgress))
    await renderTrack()
    const rows = dataRows(await table())
    const locked = rows.find((row) => within(row).queryByText('Design de sistemas'))!
    expect(locked).toHaveClass('text-muted-foreground')
    expect(within(locked).getByText('Difícil')).not.toHaveClass('text-hard')
  })

  it('as abas mostram a contagem de cada situação, também depois de filtrar', async () => {
    server.use(...trackHandlers(trackWithProgress))
    const { user } = await renderTrack()
    await table()
    expect(screen.getByRole('tab', { name: /^Todas\s*13$/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Em andamento\s*1$/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Não iniciadas\s*10$/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Dificuldade/ }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Difícil' }))
    expect(await screen.findByRole('tab', { name: /^Todas\s*2$/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Em andamento\s*0$/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Não iniciadas\s*1$/ })).toBeInTheDocument()
  })

  it('a busca ignora acento e maiúscula', async () => {
    await renderTrack('/track?q=ingles')
    await table()
    await expectRowCount(1)
    expect(within(screen.getByRole('table')).getByText('Inglês')).toBeVisible()
  })

  it('o foco volta ao botão da linha quando o painel fecha', async () => {
    const { user } = await renderTrack()
    await table()
    const open = screen.getByRole('button', { name: 'Abrir SQL e modelagem de dados' })
    await user.click(open)
    await screen.findByRole('dialog', { name: /SQL e modelagem de dados/ })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(open).toHaveFocus())
  })

  it('o painel fecha por um botão Fechar, sem texto em inglês', async () => {
    const { user } = await renderTrack()
    await table()
    await user.click(screen.getByRole('button', { name: 'Abrir SQL e modelagem de dados' }))
    const sheet = await screen.findByRole('dialog', { name: /SQL e modelagem de dados/ })
    expect(within(sheet).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('a aba Em andamento deixa só a competência em andamento', async () => {
    server.use(...trackHandlers(trackWithProgress))
    const { user } = await renderTrack()
    await table()
    await user.click(screen.getByRole('tab', { name: /Em andamento/ }))
    await expectRowCount(1)
    expect(within(screen.getByRole('table')).getByText('SQL e modelagem de dados')).toBeVisible()
  })

  it('o filtro de dificuldade Difícil deixa só as competências difíceis', async () => {
    const { user } = await renderTrack()
    await table()
    await user.click(screen.getByRole('button', { name: /Dificuldade/ }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Difícil' }))
    await expectRowCount(2)
    const visible = within(screen.getByRole('table'))
    expect(visible.getByText('Design de sistemas')).toBeVisible()
    expect(visible.getByText('Mensageria e processamento assíncrono')).toBeVisible()
  })

  it('o filtro de empresa Google deixa só linhas pedidas pelo Google', async () => {
    const { user } = await renderTrack()
    await table()
    await user.click(screen.getByRole('button', { name: /Empresa/ }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Google' }))
    await waitFor(() => expect(dataRows(screen.getByRole('table')).length).toBeLessThan(13))
    const rows = dataRows(screen.getByRole('table'))
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(within(row).getByText(/^Pedido por .*Google/)).toBeInTheDocument()
    }
  })

  it('a busca da URL filtra a tabela e dá para limpar', async () => {
    const { user, router } = await renderTrack('/track?q=sql')
    await table()
    await expectRowCount(1)
    expect(within(screen.getByRole('table')).getByText('SQL e modelagem de dados')).toBeVisible()
    expect(screen.getByText('Buscando “sql”')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }))
    await expectRowCount(13)
    expect(router.state.location.search).toBe('')
    expect(screen.queryByText('Buscando “sql”')).not.toBeInTheDocument()
  })

  it('"Limpar busca" tira só o termo da URL e põe o foco no painel das abas', async () => {
    const { user, router } = await renderTrack('/track?q=sql&origem=topo')
    await table()
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }))
    await expectRowCount(13)
    expect(router.state.location.search).toBe('?origem=topo')
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('abre o painel da competência e, dele, o diálogo da questão, devolvendo o foco', async () => {
    const { user } = await renderTrack()
    await table()
    await user.click(screen.getByRole('button', { name: 'Abrir SQL e modelagem de dados' }))
    const sheet = await screen.findByRole('dialog', { name: /SQL e modelagem de dados/ })
    expect(await within(sheet).findByText(/Consultas com junção/)).toBeInTheDocument()
    expect(within(sheet).queryByText('Prévia')).not.toBeInTheDocument()
    expect(within(sheet).getByText('Pedido em 11 de 26 vagas')).toBeInTheDocument()
    const list = await within(sheet).findByRole('list', { name: 'Questões' })
    const first = within(list).getAllByRole('button')[0]
    await user.click(first)
    await screen.findByRole('dialog', { name: /./ })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(first).toHaveFocus())
    expect(screen.getByRole('dialog', { name: /SQL e modelagem de dados/ })).toBeInTheDocument()
  })

  it('competência bloqueada mostra o motivo no painel', async () => {
    server.use(...trackHandlers(trackWithProgress))
    const { user } = await renderTrack()
    await table()
    await user.click(screen.getByRole('button', { name: 'Abrir Design de sistemas' }))
    const sheet = await screen.findByRole('dialog', { name: /Design de sistemas/ })
    expect(await within(sheet).findByText('Bloqueada')).toBeInTheDocument()
    expect(within(sheet).getByText(/Abre quando você concluir/)).toBeInTheDocument()
  })

  it('competência bloqueada lista as questões sem abrir nenhuma', async () => {
    server.use(...trackHandlers(trackWithProgress))
    const { user } = await renderTrack()
    await table()
    await user.click(screen.getByRole('button', { name: 'Abrir Design de sistemas' }))
    const sheet = await screen.findByRole('dialog', { name: /Design de sistemas/ })
    const list = await within(sheet).findByRole('list', { name: 'Questões' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(
      competencyDetail('design-de-sistemas', trackWithProgress)!.questions.length,
    )
    expect(within(list).queryAllByRole('button')).toHaveLength(0)
    expect(
      within(sheet).getByText('As questões abrem junto com a competência.'),
    ).toBeInTheDocument()
  })

  it('ao trocar de competência, o painel não mostra a anterior enquanto carrega', async () => {
    const { user } = await renderTrack()
    await table()
    await user.click(screen.getByRole('button', { name: 'Abrir SQL e modelagem de dados' }))
    const first = await screen.findByRole('dialog', { name: /SQL e modelagem de dados/ })
    await within(first).findByText(/Consultas com junção/)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Abrir APIs REST' }))
    const second = screen.getByRole('dialog')
    expect(second).not.toHaveTextContent(/Consultas com junção/)
    expect(second).not.toHaveAccessibleName(/SQL e modelagem de dados/)
    expect(await within(second).findByText(/Métodos, status, idempotência/)).toBeInTheDocument()
  })

  it('erro no painel da competência tem nova tentativa', async () => {
    server.use(
      http.get('/api/v1/career/track/competencies/:slug', () => problem(500, 'Erro', 'Falhou.'), {
        once: true,
      }),
    )
    const { user } = await renderTrack()
    await table()
    await user.click(screen.getByRole('button', { name: 'Abrir SQL e modelagem de dados' }))
    const sheet = await screen.findByRole('dialog', {
      name: 'Não foi possível carregar a competência.',
    })
    expect(within(sheet).getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a competência.',
    )
    expect(within(sheet).queryByText('Carregando competência…')).not.toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Tentar de novo' }))
    expect(await within(sheet).findByText(/Consultas com junção/)).toBeInTheDocument()
  })

  it('cada linha diz se a competência é obrigatória ou desejável', async () => {
    await renderTrack()
    await table()
    expect(screen.getByRole('button', { name: 'Abrir Nuvem' })).toHaveAccessibleDescription(
      'Desejável',
    )
    expect(
      screen.getByRole('button', { name: 'Abrir SQL e modelagem de dados' }),
    ).toHaveAccessibleDescription('Obrigatória')
    expect(screen.getByRole('columnheader', { name: 'Categoria' })).toBeInTheDocument()
  })

  it('o cartão do plano diz quais empresas ficaram de fora e leva a editar o objetivo', async () => {
    server.use(
      http.get('/api/v1/career/profile', () =>
        HttpResponse.json({
          ...careerProfile,
          companies: [
            ...careerProfile.companies,
            { slug: 'meta', name: 'Meta', group: 'big-tech' },
          ],
        }),
      ),
      ...trackHandlers({
        ...track,
        plan: { ...track.plan, missingCompanies: [{ slug: 'meta', name: 'Meta' }] },
      }),
    )
    await renderTrack()
    const plan = (
      await screen.findByRole('heading', { level: 2, name: 'Plano para Backend júnior' })
    ).closest('section')!
    expect(
      within(plan).getByText(
        'Meta ficou de fora: ainda não há trilha de Backend para esta empresa.',
      ),
    ).toBeInTheDocument()
    expect(within(plan).getByRole('link', { name: 'Editar objetivo' })).toHaveAttribute(
      'href',
      '/onboarding?edit=1',
    )
  })

  it('sem empresa de fora, o cartão do plano não fala disso', async () => {
    await renderTrack()
    const plan = (
      await screen.findByRole('heading', { level: 2, name: 'Plano para Backend júnior' })
    ).closest('section')!
    expect(within(plan).queryByText(/de fora/)).not.toBeInTheDocument()
    expect(within(plan).queryByRole('link')).not.toBeInTheDocument()
  })

  it('trilha vazia troca o plano e a tabela por um aviso com Editar objetivo', async () => {
    server.use(...trackHandlers(emptyTrack))
    await renderTrack()
    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'Ainda não há trilha de Backend para as empresas escolhidas',
    })
    const notice = heading.closest('section')!
    expect(within(notice).getByText(/Nubank e Google/)).toBeInTheDocument()
    expect(within(notice).getByRole('link', { name: 'Editar objetivo' })).toHaveAttribute(
      'href',
      '/onboarding?edit=1',
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Plano para/ })).not.toBeInTheDocument()
  })
})
