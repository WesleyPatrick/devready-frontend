import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { makeStore, type AppStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { progressApi } from '@/features/progress/api'
import { questionsApi } from '@/features/questions/api'
import { api } from '@/lib/api'
import { isoDate } from '@/lib/format'
import { burstFrom } from '@/lib/motion/celebrate'
import { setReducedMotionForTests } from '@/lib/motion/reducedMotion'
import { candidate } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { optionOf, practiceProblem, practiceProgress, practiceQuestion } from '@/test/practice'
import { renderRoute, renderWithProviders, storeWithGoal } from '@/test/render'
import { server } from '@/test/server'
import { StreakPanel } from './StreakPanel'

vi.mock('@/lib/motion/celebrate', () => ({
  cannons: vi.fn(() => Promise.resolve()),
  burstFrom: vi.fn(() => Promise.resolve()),
}))

const DAILY = 'backend-junior-java-equals-hashcode'

async function renderTrack() {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
  renderRoute('/track', { store })
  await screen.findByRole('navigation', { name: 'Navegação principal' })
  await screen.findByRole('heading', { level: 1, name: 'Sua trilha' })
  return { user: userEvent.setup(), store }
}

const sidebar = () => screen.getByRole('region', { name: 'Seu progresso' })

function answer(store: AppStore, slug: string, which: 'correct' | 'wrong') {
  return store.dispatch(
    questionsApi.endpoints.answerQuestion.initiate({ slug, optionId: optionOf(slug, which).id }),
  )
}

describe('lateral da trilha', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sequência, questão do dia e conquistas vêm da API, sem prévia', async () => {
    await renderTrack()
    const panel = within(sidebar())
    for (const name of ['6 dias seguidos', 'Questão do dia', 'Conquistas']) {
      const region = await panel.findByRole('region', { name })
      expect(within(region).queryByText('Prévia')).not.toBeInTheDocument()
    }
  })

  it('os painéis continuam com o último dado quando uma nova consulta falha', async () => {
    const { store } = await renderTrack()
    const panel = within(sidebar())
    for (const name of ['6 dias seguidos', 'Questão do dia', 'Conquistas']) {
      await panel.findByRole('region', { name })
    }
    server.use(
      http.get('/api/v1/me/progress', () => problem(500, 'Erro interno', 'Falhou.')),
      http.get('/api/v1/questions/daily', () => problem(500, 'Erro interno', 'Falhou.')),
    )
    server.use(http.get('/api/v1/me/achievements', () => problem(500, 'Erro interno', 'Falhou.')))
    store.dispatch(api.util.invalidateTags(['Progress', 'Achievement', 'Question']))
    await waitFor(() => {
      const state = store.getState()
      expect(progressApi.endpoints.getProgress.select()(state).isError).toBe(true)
      expect(progressApi.endpoints.getAchievements.select()(state).isError).toBe(true)
      expect(questionsApi.endpoints.getDailyQuestion.select()(state).isError).toBe(true)
    })
    for (const name of ['6 dias seguidos', 'Questão do dia', 'Conquistas']) {
      expect(panel.getByRole('region', { name })).toBeInTheDocument()
    }
  })

  it('trilha sem questão objetiva: o painel da questão do dia some', async () => {
    server.use(
      http.get('/api/v1/questions/daily', () =>
        problem(404, 'Não encontrado', 'Sua trilha ainda não tem questão objetiva.'),
      ),
    )
    await renderTrack()
    const panel = within(sidebar())
    await panel.findByRole('region', { name: '6 dias seguidos' })
    await panel.findByRole('region', { name: 'Conquistas' })
    await waitFor(() =>
      expect(panel.queryByText('Carregando questão do dia…')).not.toBeInTheDocument(),
    )
    expect(panel.queryByRole('region', { name: 'Questão do dia' })).not.toBeInTheDocument()
  })

  it('mostra a sequência e o calendário do mês', async () => {
    await renderTrack()
    const panel = within(sidebar())
    const heading = await panel.findByRole('heading', { name: '6 dias seguidos' })
    const section = heading.closest('section')!

    const today = new Date()
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(today)
    const prefix = isoDate(today).slice(0, 7)
    const active = practiceProgress().activity.filter(
      (day) => day.date.startsWith(prefix) && day.count > 0,
    ).length
    expect(
      within(section).getByText(`Você praticou em ${active} dias de ${month}.`),
    ).toBeInTheDocument()

    const todayCell = section.querySelector('[data-today="true"]')
    expect(todayCell).not.toBeNull()
    expect(todayCell).toHaveAttribute('title', expect.stringMatching(/atividade|sem prática/))
  })

  it('mostra a meta do dia em fração, e por extenso para leitor de tela', async () => {
    await renderTrack()
    expect(await within(sidebar()).findByText('Meta do dia')).toBeInTheDocument()
    expect(within(sidebar()).getByText('0 de 3 questões hoje')).toHaveClass('sr-only')
    const fraction = within(sidebar()).getByText('0/3')
    expect(fraction).toHaveClass('font-mono')
    expect(fraction).toHaveAttribute('aria-hidden', 'true')
  })

  it('responder a questão do dia soma o XP, sobe a sequência e troca o botão por Rever', async () => {
    const daily = practiceProblem(DAILY)
    const { user } = await renderTrack()
    const panel = within(sidebar())
    expect(await panel.findByText('Questão do dia')).toBeInTheDocument()
    const plain = daily.title.replaceAll('`', '')
    expect(
      panel.getByText((_, element) => element?.tagName === 'P' && element.textContent === plain),
    ).toBeInTheDocument()
    await user.click(await panel.findByRole('button', { name: 'Responder · +40 XP' }))
    await user.click(await screen.findByRole('radio', { name: optionOf(DAILY, 'correct').label }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText('Acertou! +40 XP')
    await user.click(screen.getAllByRole('button', { name: 'Fechar' })[0])

    await waitFor(() => expect(screen.getAllByText(/^1\.280 XP/).length).toBeGreaterThan(0))
    await waitFor(() => expect(panel.getByText('1 de 3 questões hoje')).toBeInTheDocument())
    expect(await panel.findByRole('heading', { name: '7 dias seguidos' })).toBeInTheDocument()
    await waitFor(() => expect(panel.getByText('4 de 10')).toBeInTheDocument())
    expect(await panel.findByText('Respondida')).toBeInTheDocument()
    expect(panel.getByRole('button', { name: 'Rever' })).toBeInTheDocument()
    expect(panel.queryByRole('button', { name: /^Responder/ })).not.toBeInTheDocument()
  })

  it('a questão do dia tentada e nunca acertada continua valendo XP, sem dizer que foi respondida', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
    await act(async () => {
      await answer(store, DAILY, 'wrong')
    })
    renderRoute('/track', { store })
    const panel = within(await screen.findByRole('region', { name: 'Questão do dia' }))
    expect(await panel.findByRole('button', { name: 'Responder · +40 XP' })).toBeInTheDocument()
    expect(panel.getAllByText('Tentada').length).toBeGreaterThan(0)
    expect(panel.queryByText('Respondida')).not.toBeInTheDocument()
    expect(panel.getAllByRole('button')).toHaveLength(1)
  })

  it('depois de responder pela questão do dia, o foco fica no botão do painel', async () => {
    const { user } = await renderTrack()
    const panel = within(sidebar())
    await user.click(await panel.findByRole('button', { name: 'Responder · +40 XP' }))
    await user.click(await screen.findByRole('radio', { name: optionOf(DAILY, 'correct').label }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText('Acertou! +40 XP')
    await user.click(screen.getAllByRole('button', { name: 'Fechar' })[0])
    await waitFor(() => expect(panel.getByRole('button', { name: 'Rever' })).toHaveFocus())
  })

  it('lista as conquistas, com o estado para leitor de tela', async () => {
    await renderTrack()
    expect(await within(sidebar()).findByText('3 de 10')).toBeInTheDocument()
    expect(
      within(sidebar()).getByText('Mil XP, desbloqueada: Chegou a 1.000 pontos de experiência.'),
    ).toBeInTheDocument()
    expect(
      within(sidebar())
        .getByText('Mil XP, desbloqueada: Chegou a 1.000 pontos de experiência.')
        .closest('li'),
    ).toHaveAttribute('title', 'Mil XP: Chegou a 1.000 pontos de experiência.')
  })

  it('o anel de hoje fica fora da célula e usa a cor do texto', async () => {
    await renderTrack()
    const heading = await within(sidebar()).findByRole('heading', { name: '6 dias seguidos' })
    const today = heading.closest('section')!.querySelector('[data-today="true"]')!
    expect(today).toHaveClass('outline-2', 'outline-offset-2', 'outline-foreground')
    expect(today).not.toHaveClass('-outline-offset-2')
  })

  it('a célula de hoje é o dia do mês de hoje', async () => {
    await renderTrack()
    const heading = await within(sidebar()).findByRole('heading', { name: '6 dias seguidos' })
    const today = heading.closest('section')!.querySelector('[data-today="true"]')!
    expect(today.getAttribute('title')).toMatch(new RegExp(`^${new Date().getDate()} de `))
  })

  it('a conquista bloqueada é lida como bloqueada e mostra o cadeado', async () => {
    await renderTrack()
    const text = await within(sidebar()).findByText(
      'Uma semana seguida, bloqueada: Praticou sete dias seguidos.',
    )
    expect(text.closest('li')!.querySelector('svg')).toHaveClass('lucide-lock')
  })

  it('a barra da meta começa vazia', async () => {
    await renderTrack()
    const goal = (await within(sidebar()).findByText('0 de 3 questões hoje')).parentElement!
    const fill = goal.nextElementSibling!.firstElementChild as HTMLElement
    expect(parseFloat(fill.style.width)).toBe(0)
  })

  it('a questão do dia acima de Júnior mostra o nível', async () => {
    server.use(
      http.get('/api/v1/questions/daily', () =>
        HttpResponse.json({ ...practiceQuestion(DAILY), level: 'SENIOR' }),
      ),
    )
    await renderTrack()
    const panel = within(await screen.findByRole('region', { name: 'Questão do dia' }))
    const tag = await panel.findByText('Sênior')
    expect(tag).toHaveTextContent(/^Nível: Sênior$/)
    expect(within(tag).getByText('Nível:')).toHaveClass('sr-only')
  })

  it('a questão do dia júnior não mostra etiqueta de nível', async () => {
    await renderTrack()
    const panel = within(await screen.findByRole('region', { name: 'Questão do dia' }))
    await panel.findByRole('button', { name: 'Responder · +40 XP' })
    expect(panel.queryByText('Júnior')).not.toBeInTheDocument()
  })
})

describe('calendário do mês', () => {
  async function renderAt(iso: string) {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(iso))
    try {
      renderWithProviders(<StreakPanel />, storeWithGoal())
      const heading = await screen.findByRole('heading', { name: /dias? seguidos?/ })
      return heading.closest('section')!
    } finally {
      vi.useRealTimers()
    }
  }
  const blanksBeforeFirstDay = (section: HTMLElement) => {
    const grid = section.querySelectorAll('[aria-hidden="true"].grid')[1]
    const cells = Array.from(grid.children)
    return cells.findIndex((cell) => cell.hasAttribute('title'))
  }

  it('começa a semana na segunda: mês que começa no domingo tem seis células vazias', async () => {
    const section = await renderAt('2026-02-15T12:00:00')
    expect(blanksBeforeFirstDay(section)).toBe(6)
  })

  it('o resumo para leitor de tela usa o singular com um dia', async () => {
    const section = await renderAt('2026-10-02T12:00:00')
    expect(within(section).getByText('Você praticou em 1 dia de outubro.')).toBeInTheDocument()
  })

  it('mês que começa na segunda não tem célula vazia', async () => {
    const section = await renderAt('2026-06-15T12:00:00')
    expect(blanksBeforeFirstDay(section)).toBe(0)
  })
})

describe('movimento', () => {
  const side = () => screen.getByRole('region', { name: 'Seu progresso', hidden: true })

  beforeEach(() => {
    setReducedMotionForTests(false)
    vi.mocked(burstFrom).mockClear()
  })
  afterEach(() => vi.useRealTimers())

  it('hoje pulsa, a barra da meta enche, a meta comemora e a conquista gira', async () => {
    const { user, store } = await renderTrack()
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const panel = within(side())
    const section = (await panel.findByRole('heading', { name: '6 dias seguidos' })).closest(
      'section',
    )!
    expect(section.querySelector('[data-today="true"]')).not.toHaveClass('animate-pop')

    await user.click(await panel.findByRole('button', { name: 'Responder · +40 XP' }))
    await user.click(await screen.findByRole('radio', { name: optionOf(DAILY, 'correct').label }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText('Acertou! +40 XP')
    expect(await panel.findByText('1 de 3 questões hoje')).toBeInTheDocument()
    expect(await panel.findByText('7 dias seguidos')).toBeInTheDocument()
    expect(side().querySelector('[data-today="true"]')).not.toHaveClass('animate-pop')
    const goalWidth = () =>
      parseFloat(
        (side().querySelector('[data-slot="goal-bar"]')!.firstElementChild as HTMLElement).style
          .width,
      )
    expect(goalWidth()).toBe(0)
    act(() => vi.advanceTimersByTime(1000))
    expect(goalWidth()).toBe(0)
    expect(within(side()).getByText('0/3')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Fechar' })[0])

    await waitFor(() =>
      expect(side().querySelector('[data-today="true"]')).toHaveClass('animate-pop'),
    )
    await waitFor(() => {
      act(() => vi.advanceTimersByTime(100))
      expect(goalWidth()).toBeCloseTo(33.33, 1)
    })
    const barBursts = () =>
      vi.mocked(burstFrom).mock.calls.filter(([el]) => el?.getAttribute('data-slot') === 'goal-bar')
    expect(barBursts()).toHaveLength(0)

    await act(async () => {
      await answer(store, 'backend-junior-java-checked-exceptions', 'wrong')
      await answer(store, 'backend-junior-spring-constructor-injection', 'correct')
    })
    await waitFor(() => expect(barBursts()).toHaveLength(1))
    expect(side().querySelector('[data-slot="goal"]')).toHaveClass('animate-glow-easy')

    await waitFor(() => {
      const item = side().querySelector('li[title^="Uma semana seguida"]')!
      expect(item.querySelector('span[class*="animate-unlock"]')).not.toBeNull()
    })

    await act(async () => {
      await answer(store, 'backend-junior-unit-test-doubles', 'correct')
    })
    await waitFor(() =>
      expect(progressApi.endpoints.getProgress.select()(store.getState()).data?.xp).toBe(
        practiceProgress().xp,
      ),
    )
    await act(async () => {})
    expect(barBursts()).toHaveLength(1)
  })
})
