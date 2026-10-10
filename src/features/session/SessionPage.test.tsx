import { screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import userEvent from '@testing-library/user-event'
import { TWO_SUM_STARTERS } from '@/test/challenge'
import { optionOf } from '@/test/practice'
import { problem } from '@/test/problem'
import { renderRoute, storeWithGoal } from '@/test/render'
import { server } from '@/test/server'
import { api } from '@/lib/api'
import {
  openLesson,
  openSimulation,
  pauseSessionSubmissions,
  resumeSessionSubmissions,
  sessionSnapshot,
  SIMULATION_QUESTIONS,
} from '@/test/session'
import { sessionApi } from './api'

vi.mock('@/lib/motion/celebrate', () => ({
  cannons: vi.fn(() => Promise.resolve()),
  burstFrom: vi.fn(() => Promise.resolve()),
}))

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

let currentStore: ReturnType<typeof storeWithGoal> | null = null

async function open(id: string, store = storeWithGoal()) {
  currentStore = store
  const rendered = renderRoute(`/sessions/${id}`, { store })
  await screen.findByRole('heading', { level: 1 })
  return { ...rendered, user: userEvent.setup() }
}

async function sessionApiAnswer(sessionId: string, position: number, optionId: string) {
  await currentStore!.dispatch(
    sessionApi.endpoints.answerSessionQuestion.initiate({ sessionId, position, optionId }),
  )
}

async function goToItem(name: RegExp) {
  const nav = within(screen.getByRole('navigation', { name: 'Itens da sessão' }))
  await userEvent.setup().click(nav.getByRole('button', { name }))
}

describe('página da sessão', () => {
  it('abre a simulação com o topo, o cronômetro e os itens, na primeira questão', async () => {
    const session = openSimulation()
    await open(session.id)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Simulação · Backend júnior' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent(/^4[45]:\d\d$/)
    const nav = within(screen.getByRole('navigation', { name: 'Itens da sessão' }))
    expect(nav.getAllByRole('listitem')).toHaveLength(10)
    expect(nav.getAllByRole('button')[0]).toHaveAttribute('aria-current', 'step')
    expect(
      screen.getByRole('radio', { name: optionOf(SIMULATION_QUESTIONS[0], 'correct').label }),
    ).toBeInTheDocument()
  })

  it('a escolha é salva na hora, sem dizer se acertou, e volta marcada', async () => {
    const session = openSimulation()
    const { user } = await open(session.id)
    const [first, second] = SIMULATION_QUESTIONS
    const wrong = optionOf(first, 'wrong')

    await user.click(screen.getByRole('radio', { name: wrong.label }))

    await waitFor(() =>
      expect(sessionSnapshot(session.id).questions[0].chosenOptionId).toBe(wrong.id),
    )
    expect(await screen.findByText(/Escolha salva\./)).toBeInTheDocument()
    expect(screen.queryByText('Acertou!')).not.toBeInTheDocument()
    expect(screen.queryByText('Errou.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(
      await screen.findByRole('radio', { name: optionOf(second, 'correct').label }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByRole('radio', { name: wrong.label })).toBeChecked()
  })

  it('o cronômetro sai do prazo do servidor, fica vermelho abaixo de 5 minutos e encerra no zero', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const start = new Date()
      vi.setSystemTime(start)
      const session = openSimulation({ deadlineAt: new Date(start.getTime() + 4 * 60_000) })
      const { router } = await open(session.id)
      const timer = screen.getByRole('timer')
      expect(timer).toHaveTextContent('04:00')
      expect(timer).toHaveClass('text-hard')

      vi.setSystemTime(new Date(start.getTime() + 4 * 60_000 + 1000))

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(`/sessions/${session.id}/result`),
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('no desafio, a lateral vira a barra numerada; Rodar mostra os visíveis e Enviar só a contagem', async () => {
    const session = openSimulation()
    const { user } = await open(session.id)
    await goToItem(/Soma de dois números/)

    const bar = within(screen.getByRole('navigation', { name: 'Itens da sessão' }))
    expect(bar.getByRole('button', { name: 'Item 9: Soma de dois números' })).toHaveTextContent('9')
    expect(screen.getByText('Envios restantes: 5 de 5')).toBeInTheDocument()
    expect(await screen.findByRole('textbox', { name: 'Código' })).toHaveValue(
      TWO_SUM_STARTERS.JAVA,
    )

    await user.click(screen.getByRole('button', { name: 'Rodar' }))
    expect(await screen.findByText('Passou nos casos visíveis')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText('Enviado: 6 de 6 casos')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Casos' })).not.toBeInTheDocument()
    expect(await screen.findByText('Envios restantes: 4 de 5')).toBeInTheDocument()
  })

  it('sem envios restantes, Enviar fica bloqueado e diz por quê', async () => {
    const session = openSimulation()
    const store = storeWithGoal()
    for (let i = 0; i < 5; i++) {
      const { data: ticket } = await store.dispatch(
        sessionApi.endpoints.submitSessionCode.initiate({
          sessionId: session.id,
          position: 1,
          language: 'JAVA',
          sourceCode: `x${i}`,
        }),
      )
      for (let step = 0; step < 2; step++) {
        await store.dispatch(
          sessionApi.endpoints.getSessionSubmission.initiate(ticket!.id, { forceRefetch: true }),
        )
      }
    }
    const { user } = await open(session.id, store)
    await goToItem(/Soma de dois números/)

    expect(await screen.findByText('Envios restantes: 0 de 5')).toBeInTheDocument()
    const submit = screen.getByRole('button', { name: 'Enviar' })
    expect(submit).toHaveAttribute('aria-disabled', 'true')
    await user.click(submit)
    expect(
      await screen.findByText('Os 5 envios deste desafio já foram usados.'),
    ).toBeInTheDocument()
  })

  it('o item atual sobrevive à recarga: um store novo abre no mesmo item', async () => {
    const session = openSimulation()
    const first = await open(session.id)
    await goToItem(/^3\./)
    expect(
      within(screen.getByRole('navigation', { name: 'Itens da sessão' })).getAllByRole('button')[2],
    ).toHaveAttribute('aria-current', 'step')
    first.unmount()

    await open(session.id, storeWithGoal())

    const nav = within(screen.getByRole('navigation', { name: 'Itens da sessão' }))
    expect(nav.getAllByRole('button')[2]).toHaveAttribute('aria-current', 'step')
    expect(nav.getAllByRole('button')[0]).not.toHaveAttribute('aria-current')
  })

  it('sem o sessionStorage, a página abre no primeiro item e segue funcionando', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    const session = openSimulation()
    await open(session.id)
    await goToItem(/^3\./)

    const nav = within(screen.getByRole('navigation', { name: 'Itens da sessão' }))
    expect(nav.getAllByRole('button')[2]).toHaveAttribute('aria-current', 'step')
    vi.restoreAllMocks()
  })

  it('o rascunho fica por sessão, desafio e linguagem', async () => {
    const session = openSimulation()
    const { user } = await open(session.id)
    await goToItem(/Soma de dois números/)

    const editor = await screen.findByRole('textbox', { name: 'Código' })
    await user.clear(editor)
    await user.type(editor, 'meu código')

    expect(localStorage.getItem(`devready-session-draft:${session.id}:two-sum:JAVA`)).toBe(
      'meu código',
    )
    expect(localStorage.getItem('devready-draft:two-sum:JAVA')).toBeNull()
  })

  it('encerrar pede confirmação, diz quantos itens faltam e leva ao resultado', async () => {
    const session = openSimulation()
    const { user, router } = await open(session.id)

    await user.click(screen.getByRole('button', { name: 'Encerrar' }))
    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByText(/8 questões e 2 desafios ainda sem resposta/)).toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Encerrar' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/sessions/${session.id}/result`),
    )
  })

  it('cancelar ou Esc no diálogo de encerrar devolve o foco ao botão Encerrar', async () => {
    const session = openSimulation()
    const { user } = await open(session.id)
    const finish = screen.getByRole('button', { name: 'Encerrar' })

    await user.click(finish)
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(finish).toHaveFocus()

    await user.click(finish)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(finish).toHaveFocus()
  })

  it('encerrar com envio rodando mostra "Corrigindo…" até a correção terminar', async () => {
    pauseSessionSubmissions()
    const session = openSimulation()
    const { user, router } = await open(session.id)
    await goToItem(/Soma de dois números/)
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(await screen.findByText('Na fila…')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Encerrar' }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Encerrar' }),
    )

    expect(await screen.findByText('Corrigindo…')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/sessions/${session.id}`)
    resumeSessionSubmissions()
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/sessions/${session.id}/result`),
    )
  })

  it('na lição, sem cronômetro, a resposta revela o gabarito e o XP, e a última leva ao resultado', async () => {
    const lesson = openLesson()
    const { user } = await open(lesson.id)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Lição · SQL e modelagem de dados' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    await goToItem(/Busca por email ficou lenta/)
    const slug = lesson.questions[2].slug
    await user.click(screen.getByRole('radio', { name: optionOf(slug, 'correct').label }))

    expect(await screen.findByText(/Acertou!/)).toHaveTextContent('Acertou! +30 XP')
    expect(screen.getByText('Explicação')).toBeInTheDocument()
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled()

    for (const position of [1, 2, 4]) {
      await sessionApiAnswer(
        lesson.id,
        position,
        optionOf(lesson.questions[position - 1].slug, 'wrong').id,
      )
    }
    expect(await screen.findByRole('link', { name: 'Ver resultado' })).toHaveAttribute(
      'href',
      `/sessions/${lesson.id}/result`,
    )
  })

  it('a contagem de envios não quebra de linha, e a barra deixa os botões descerem em tela estreita', async () => {
    const session = openSimulation()
    await open(session.id)
    await goToItem(/Soma de dois números/)

    const note = screen.getByText('Envios restantes: 5 de 5')
    expect(note).toHaveClass('whitespace-nowrap', 'shrink-0')
    expect(note.parentElement).toHaveClass('flex-wrap')
  })

  it('o menu de itens tem largura mínima legível e cabe na tela estreita', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }))
    const session = openSimulation()
    const { user } = await open(session.id)

    await user.click(screen.getByRole('button', { name: 'Itens (1 de 10)' }))

    const menu = await screen.findByRole('menu')
    expect(menu).toHaveClass('w-auto', 'min-w-64', 'max-w-[calc(100vw-2rem)]')
  })

  it('abaixo de 1024 px, os itens ficam num menu', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }))
    const session = openSimulation()
    const { user } = await open(session.id)

    expect(screen.queryByRole('navigation', { name: 'Itens da sessão' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Itens (1 de 10)' }))
    await user.click(await screen.findByRole('menuitem', { name: /Soma de dois números/ }))

    expect(await screen.findByText('Envios restantes: 5 de 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Itens (9 de 10)' })).toBeInTheDocument()
  })

  it('começar uma simulação encerra a lição aberta, e a página da lição não a mostra mais em andamento', async () => {
    const lesson = openLesson()
    await open(lesson.id)
    expect(screen.getByRole('button', { name: 'Encerrar' })).toBeInTheDocument()

    await currentStore!.dispatch(
      sessionApi.endpoints.startSimulation.initiate({ area: 'backend', level: 'JUNIOR' }),
    )

    expect(await screen.findByRole('link', { name: 'Ver resultado' })).toHaveAttribute(
      'href',
      `/sessions/${lesson.id}/result`,
    )
    expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument()
  })

  it('se a sessão passa a 404 depois de carregada, a página não segue mostrando a cópia antiga', async () => {
    const session = openSimulation()
    await open(session.id)
    server.use(
      http.get('/api/v1/sessions/:id', () =>
        problem(404, 'Não encontrado', 'Sessão não encontrada.'),
      ),
    )

    await currentStore!.dispatch(api.util.invalidateTags([{ type: 'Session', id: session.id }]))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sessão não encontrada' }),
    ).toBeInTheDocument()
  })

  it('sessão que não existe mostra "não encontrada"', async () => {
    renderRoute('/sessions/nao-existe', { store: storeWithGoal() })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sessão não encontrada' }),
    ).toBeInTheDocument()
  })
})
