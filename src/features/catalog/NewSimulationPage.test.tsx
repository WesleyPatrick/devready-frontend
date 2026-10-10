import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { problem } from '@/test/handlers'
import { renderRoute } from '@/test/render'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { sessionApi } from '@/features/session/api'
import { areas, candidate, careerProfile } from '@/test/fixtures'
import { openLesson, openSimulation } from '@/test/session'
import type { Area } from './api'
import { catalogTexts } from './texts'

function authenticatedStore() {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
  return store
}

function cardOf(name: string) {
  const card = screen.getByRole('radio', { name }).closest('label')
  if (!card) throw new Error(`linha da área ${name} não encontrada`)
  return within(card)
}

describe('NewSimulationPage', () => {
  it('título no mesmo tamanho das outras páginas, sem ícone', async () => {
    renderRoute('/simulations/new', { store: authenticatedStore() })
    const title = await screen.findByRole('heading', { level: 1, name: 'Nova simulação' })
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'tracking-tight')
    expect(title.querySelector('svg')).toBeNull()
  })

  it('as áreas são linhas de rádio num painel, com os números numa linha só em mono', async () => {
    renderRoute('/simulations/new', { store: authenticatedStore() })
    const radio = await screen.findByRole('radio', { name: 'Backend' })
    expect(screen.queryByRole('heading', { name: 'Backend' })).not.toBeInTheDocument()
    expect(radio).not.toHaveClass('sr-only')
    const details = document.getElementById(radio.getAttribute('aria-describedby')!)!
    expect(details).toHaveClass('font-mono')
    expect(details).toHaveTextContent(
      '8 questões objetivas · 2 desafios de código · 45 minutos · Objetivas valem 50% da nota',
    )
    const panel = radio.closest('section')!
    expect(panel).toContainElement(screen.getByRole('radio', { name: 'DevOps' }))
    expect(panel).not.toContainElement(screen.getByRole('heading', { level: 1 }))
  })

  it('lista as áreas com a configuração de cada sessão na própria linha', async () => {
    renderRoute('/simulations/new', { store: authenticatedStore() })

    expect(await screen.findByRole('radio', { name: 'Backend' })).toBeInTheDocument()

    for (const name of ['Backend', 'Frontend']) {
      const card = cardOf(name)
      expect(card.getByText('8 questões objetivas')).toBeInTheDocument()
      expect(card.getByText('2 desafios de código')).toBeInTheDocument()
      expect(card.getByText('45 minutos')).toBeInTheDocument()
      expect(card.getByText('Objetivas valem 50% da nota')).toBeInTheDocument()
    }

    const devops = cardOf('DevOps')
    expect(devops.getByText('10 questões objetivas')).toBeInTheDocument()
    expect(devops.getByText('1 desafio de código')).toBeInTheDocument()
    expect(devops.getByText('40 minutos')).toBeInTheDocument()
    expect(devops.getByText('Objetivas valem 70% da nota')).toBeInTheDocument()
  })

  it('cada linha é um rádio nativo nomeado pela área e descrito pelos números', async () => {
    renderRoute('/simulations/new', { store: authenticatedStore() })

    const radio = await screen.findByRole('radio', { name: 'Backend' })
    expect(radio).toHaveAttribute('type', 'radio')
    expect(radio).toHaveAccessibleDescription(/8 questões objetivas/)
    expect(radio).toHaveAccessibleDescription(/45 minutos/)
    expect(screen.getByRole('group', { name: catalogTexts.area })).toBeInTheDocument()
  })

  it('abre com a área da stack e a senioridade do objetivo, e começa a simulação', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/simulations/new', { store: authenticatedStore() })

    expect(await screen.findByRole('radio', { name: 'Backend' })).toBeChecked()
    expect(screen.getByRole('combobox', { name: 'Nível' })).toHaveTextContent('Júnior')
    const start = screen.getByRole('button', { name: 'Iniciar simulação' })
    expect(start).not.toHaveAttribute('aria-disabled')
    expect(screen.queryByText(/próxima etapa/i)).not.toBeInTheDocument()

    await user.click(start)

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/sessions\/sessao-/))
  })

  it('com objetivo Pleno, o nível já vem em Pleno', async () => {
    server.use(
      http.get('/api/v1/career/profile', () =>
        HttpResponse.json({ ...careerProfile, seniority: 'PLENO' }),
      ),
    )
    renderRoute('/simulations/new', { store: authenticatedStore() })

    expect(await screen.findByRole('radio', { name: 'Backend' })).toBeChecked()
    expect(screen.getByRole('combobox', { name: 'Nível' })).toHaveTextContent('Pleno')
  })

  it('sem conteúdo na senioridade do objetivo, cai no primeiro nível da área', async () => {
    server.use(
      http.get('/api/v1/career/profile', () =>
        HttpResponse.json({ ...careerProfile, seniority: 'SENIOR' }),
      ),
      http.get('/api/v1/areas', () =>
        HttpResponse.json([{ ...areas[0], levels: ['JUNIOR', 'PLENO'] }]),
      ),
    )
    renderRoute('/simulations/new', { store: authenticatedStore() })

    expect(await screen.findByRole('radio', { name: 'Backend' })).toBeChecked()
    expect(screen.getByRole('combobox', { name: 'Nível' })).toHaveTextContent('Júnior')
  })

  it('sem a área da stack entre as disponíveis, nenhuma área vem marcada', async () => {
    server.use(
      http.get('/api/v1/career/profile', () =>
        HttpResponse.json({
          ...careerProfile,
          stack: { slug: 'pandas', name: 'Python e pandas', area: 'dados' },
        }),
      ),
    )
    renderRoute('/simulations/new', { store: authenticatedStore() })

    await screen.findByRole('radio', { name: 'Backend' })
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked()
    expect(screen.getByText(catalogTexts.chooseArea)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar simulação' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('trocar de área continua possível', async () => {
    const user = userEvent.setup()
    renderRoute('/simulations/new', { store: authenticatedStore() })

    expect(await screen.findByRole('radio', { name: 'Backend' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Frontend' }))

    expect(screen.getByRole('radio', { name: 'Frontend' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Backend' })).not.toBeChecked()
  })

  it('área sem nível com conteúdo não deixa começar', async () => {
    server.use(http.get('/api/v1/areas', () => HttpResponse.json([{ ...areas[0], levels: [] }])))
    const user = userEvent.setup()
    renderRoute('/simulations/new', { store: authenticatedStore() })

    await user.click(await screen.findByText('Backend'))

    expect(
      screen.getByText('Ainda não há conteúdo suficiente para uma simulação nesta área.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar simulação' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('com uma simulação aberta, mostra Continuar e Encerrar com confirmação', async () => {
    const session = openSimulation()
    const user = userEvent.setup()
    const { router } = renderRoute('/simulations/new', { store: authenticatedStore() })

    const banner = within(await screen.findByRole('region', { name: 'Simulação em andamento' }))
    expect(banner.getByText(/Backend · Júnior/)).toBeInTheDocument()
    expect(banner.getByRole('link', { name: 'Continuar' })).toHaveAttribute(
      'href',
      `/sessions/${session.id}`,
    )
    await user.click(banner.getByRole('button', { name: 'Encerrar' }))
    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText(/8 questões e 2 desafios ainda sem resposta/)).toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Encerrar' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/sessions/${session.id}/result`),
    )
  })

  it('o 409 ao começar leva à sessão aberta', async () => {
    const user = userEvent.setup()
    renderRoute('/simulations/new', { store: authenticatedStore() })
    await screen.findByRole('radio', { name: 'Backend' })
    const session = openSimulation()

    await user.click(screen.getByText('Backend'))
    await user.click(screen.getByRole('button', { name: 'Iniciar simulação' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Você já tem uma simulação em andamento.')
    expect(within(alert).getByRole('link', { name: 'Continuar' })).toHaveAttribute(
      'href',
      `/sessions/${session.id}`,
    )
  })

  it('Esc no diálogo de encerrar do painel devolve o foco ao botão Encerrar', async () => {
    openSimulation()
    const user = userEvent.setup()
    renderRoute('/simulations/new', { store: authenticatedStore() })
    const banner = within(await screen.findByRole('region', { name: 'Simulação em andamento' }))
    const finish = banner.getByRole('button', { name: 'Encerrar' })

    await user.click(finish)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(finish).toHaveFocus()
  })

  it('o histórico lista as sessões, da mais nova para a mais antiga, com link para o resultado', async () => {
    const lesson = openLesson()
    const store = authenticatedStore()
    await store.dispatch(sessionApi.endpoints.finishSession.initiate(lesson.id))
    renderRoute('/simulations/new', { store })

    const history = within(await screen.findByRole('region', { name: 'Suas sessões' }))
    expect(await history.findByText('Lição · SQL e modelagem de dados')).toBeInTheDocument()
    expect(history.getByRole('link', { name: /Ver resultado/ })).toHaveAttribute(
      'href',
      `/sessions/${lesson.id}/result`,
    )
  })

  it('o histórico leva também às sessões corrigindo e às que falharam, para a página da sessão', async () => {
    const base = {
      format: 'SIMULATION',
      area: { slug: 'backend', name: 'Backend' },
      level: 'JUNIOR',
      competency: null,
      finalScore: null,
      xpAwarded: 0,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    }
    server.use(
      http.get('/api/v1/sessions', () =>
        HttpResponse.json([
          { ...base, id: 'corrigindo-1', status: 'SUBMITTED' },
          { ...base, id: 'falhou-1', status: 'FAILED' },
        ]),
      ),
    )
    renderRoute('/simulations/new', { store: authenticatedStore() })

    const history = within(await screen.findByRole('region', { name: 'Suas sessões' }))
    expect(await history.findByRole('link', { name: /Acompanhar correção/ })).toHaveAttribute(
      'href',
      '/sessions/corrigindo-1',
    )
    expect(history.getByRole('link', { name: /Ver detalhes/ })).toHaveAttribute(
      'href',
      '/sessions/falhou-1',
    )
    expect(history.queryByRole('link', { name: /Ver resultado/ })).not.toBeInTheDocument()
  })

  it('sem sessões, o histórico diz isso', async () => {
    renderRoute('/simulations/new', { store: authenticatedStore() })
    const history = within(await screen.findByRole('region', { name: 'Suas sessões' }))
    expect(
      await history.findByText('Nenhuma sessão ainda. A primeira aparece aqui.'),
    ).toBeInTheDocument()
  })

  it('escolhe o nível no seletor', async () => {
    const user = userEvent.setup()
    renderRoute('/simulations/new', { store: authenticatedStore() })

    await user.click(await screen.findByRole('radio', { name: 'Backend' }))
    const level = screen.getByRole('combobox', { name: 'Nível' })
    expect(level).toHaveTextContent('Júnior')

    await user.click(level)
    await user.click(await screen.findByRole('option', { name: 'Pleno' }))

    expect(screen.getByRole('combobox', { name: 'Nível' })).toHaveTextContent('Pleno')
  })

  it('começa uma simulação Pleno, acima do objetivo Júnior', async () => {
    const user = userEvent.setup()
    renderRoute('/simulations/new', { store: authenticatedStore() })

    await user.click(await screen.findByRole('radio', { name: 'Backend' }))
    await user.click(screen.getByRole('combobox', { name: 'Nível' }))
    await user.click(await screen.findByRole('option', { name: 'Pleno' }))
    await user.click(screen.getByRole('button', { name: 'Iniciar simulação' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Simulação · Backend pleno' }),
    ).toBeInTheDocument()
  })

  it('volta para o primeiro nível da área quando o escolhido não existe nela', async () => {
    const restricted: Area = {
      slug: 'mobile',
      name: 'Mobile',
      questionCount: 6,
      challengeCount: 1,
      durationMinutes: 30,
      objectiveWeight: 0.6,
      levels: ['JUNIOR'],
    }
    server.use(http.get('/api/v1/areas', () => HttpResponse.json([areas[0], restricted])))
    const user = userEvent.setup()
    renderRoute('/simulations/new', { store: authenticatedStore() })

    await user.click(await screen.findByRole('radio', { name: 'Backend' }))
    await user.click(screen.getByRole('combobox', { name: 'Nível' }))
    await user.click(await screen.findByRole('option', { name: 'Pleno' }))
    expect(screen.getByRole('combobox', { name: 'Nível' })).toHaveTextContent('Pleno')

    await user.click(screen.getByRole('radio', { name: 'Mobile' }))

    expect(screen.getByRole('combobox', { name: 'Nível' })).toHaveTextContent('Júnior')
  })

  it('abre pelo item Simulação da navegação da área logada', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/track', { store: authenticatedStore() })

    const nav = within(await screen.findByRole('navigation', { name: 'Navegação principal' }))
    await user.click(nav.getByRole('link', { name: 'Simulação' }))

    expect(await screen.findByRole('heading', { name: 'Nova simulação' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/simulations/new')
  })

  it('mostra o carregamento antes das áreas', async () => {
    server.use(
      http.get('/api/v1/areas', async () => {
        await delay(100)
        return HttpResponse.json(areas)
      }),
    )
    renderRoute('/simulations/new', { store: authenticatedStore() })

    const loading = await screen.findByText(catalogTexts.loading)
    expect(loading.closest('[role="status"]')).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Backend' })).not.toBeInTheDocument()
    expect(await screen.findByRole('radio', { name: 'Backend' })).toBeInTheDocument()
    expect(screen.queryByText(catalogTexts.loading)).not.toBeInTheDocument()
  })

  it('mostra erro e carrega as áreas ao tentar de novo', async () => {
    server.use(
      http.get('/api/v1/areas', () => problem(500, 'Erro interno', 'Falhou.'), { once: true }),
    )
    const user = userEvent.setup()
    renderRoute('/simulations/new', { store: authenticatedStore() })

    expect(await screen.findByRole('alert')).toHaveTextContent(catalogTexts.error)
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('radio', { name: 'Backend' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('avisa quando não há áreas disponíveis', async () => {
    server.use(http.get('/api/v1/areas', () => HttpResponse.json([])))
    renderRoute('/simulations/new', { store: authenticatedStore() })

    expect(await screen.findByText('Nenhuma área disponível no momento.')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Nível' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar simulação' })).not.toBeInTheDocument()
  })

  it('encerrada a simulação, o banner some mesmo com o dado antigo no cache', async () => {
    const session = openSimulation()
    const store = authenticatedStore()
    renderRoute('/simulations/new', { store })
    await screen.findByRole('region', { name: 'Simulação em andamento' })

    await store.dispatch(sessionApi.endpoints.finishSession.initiate(session.id))

    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Simulação em andamento' }),
      ).not.toBeInTheDocument(),
    )
  })
})
