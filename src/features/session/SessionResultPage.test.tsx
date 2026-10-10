import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { careerProfile } from '@/test/fixtures'
import { optionOf } from '@/test/practice'
import { renderRoute, storeWithGoal } from '@/test/render'
import { openLesson, openSimulation, SIMULATION_QUESTIONS } from '@/test/session'
import type { Level } from '@/lib/learning'
import { sessionApi } from './api'

vi.mock('@/lib/motion/celebrate', () => ({
  cannons: vi.fn(() => Promise.resolve()),
  burstFrom: vi.fn(() => Promise.resolve()),
}))

afterEach(() => localStorage.clear())

type Store = ReturnType<typeof storeWithGoal>

function item(list: ReturnType<typeof within>, prefix: string) {
  const summary = list.getByText(
    (_: string, element: Element | null) =>
      element?.tagName === 'SUMMARY' && (element.textContent ?? '').startsWith(prefix),
  )
  return { summary, details: summary.closest('details')! }
}

async function answer(store: Store, sessionId: string, position: number, optionId: string) {
  await store.dispatch(
    sessionApi.endpoints.answerSessionQuestion.initiate({ sessionId, position, optionId }),
  )
}

async function submitTwoSum(store: Store, sessionId: string, code: string) {
  const { data: ticket } = await store.dispatch(
    sessionApi.endpoints.submitSessionCode.initiate({
      sessionId,
      position: 1,
      language: 'JAVA',
      sourceCode: code,
    }),
  )
  for (let i = 0; i < 2; i++) {
    await store.dispatch(
      sessionApi.endpoints.getSessionSubmission.initiate(ticket!.id, { forceRefetch: true }),
    )
  }
}

async function correctedSimulation(store: Store, level: Level = 'JUNIOR') {
  const session = openSimulation({ level })
  await answer(store, session.id, 1, optionOf(SIMULATION_QUESTIONS[0], 'correct').id)
  await answer(store, session.id, 2, optionOf(SIMULATION_QUESTIONS[1], 'wrong').id)
  for (const position of [3, 4, 5, 6]) {
    await answer(
      store,
      session.id,
      position,
      optionOf(SIMULATION_QUESTIONS[position - 1], 'correct').id,
    )
  }
  await submitTwoSum(store, session.id, 'class Solution { /* certo */ }')
  await store.dispatch(sessionApi.endpoints.finishSession.initiate(session.id))
  return session
}

describe('resultado da sessão', () => {
  it('mostra a nota, o XP, os fortes e as lacunas com link para a trilha', async () => {
    const store = storeWithGoal()
    const session = await correctedSimulation(store)
    renderRoute(`/sessions/${session.id}/result`, { store })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Resultado da simulação' }),
    ).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getByText('56%')).toBeInTheDocument()
    expect(main.getByText('+56 XP')).toBeInTheDocument()
    const strengths = within(main.getByRole('region', { name: 'Pontos fortes' }))
    expect(
      strengths.getByText('Você acertou 4 de 4 em SQL e modelagem de dados: ponto forte.'),
    ).toBeInTheDocument()
    expect(strengths.getByRole('link', { name: /Estudar na trilha/ })).toHaveAttribute(
      'href',
      '/track?q=SQL%20e%20modelagem%20de%20dados',
    )
    const gaps = within(main.getByRole('region', { name: 'Lacunas' }))
    expect(
      gaps.getByText('0 de 1 em Design de sistemas: vale revisar os materiais da competência.'),
    ).toBeInTheDocument()
  })

  it('a correção vem item a item, num acordeão, com a sua, a certa e a explicação', async () => {
    const store = storeWithGoal()
    const session = await correctedSimulation(store)
    const user = userEvent.setup()
    renderRoute(`/sessions/${session.id}/result`, { store })

    const list = within(await screen.findByRole('region', { name: 'Correção item a item' }))
    const { summary, details: second } = item(list, '2. Injeção por construtor no Spring')
    expect(second).not.toHaveAttribute('open')
    await user.click(summary)

    expect(second).toHaveAttribute('open')
    expect(within(second).getByText('Errada')).toBeInTheDocument()
    expect(within(second).getByText('Sua resposta')).toBeInTheDocument()
    expect(within(second).getByText('Resposta certa')).toBeInTheDocument()
    expect(within(second).getByText('Explicação')).toBeInTheDocument()
    expect(within(item(list, '7. ').details).getByText('Sem resposta')).toBeInTheDocument()
    const challenge = item(list, '9. Soma de dois números').details
    expect(within(challenge).getByText('Melhor envio: 6 de 6 casos')).toBeInTheDocument()
  })

  it('"Abrir no editor" troca o rascunho do desafio pelo código do melhor envio e abre a página', async () => {
    const store = storeWithGoal()
    const session = await correctedSimulation(store)
    const user = userEvent.setup()
    const { router } = renderRoute(`/sessions/${session.id}/result`, { store })

    const list = within(await screen.findByRole('region', { name: 'Correção item a item' }))
    const { summary, details: challenge } = item(list, '9. Soma de dois números')
    await user.click(summary)
    await user.click(within(challenge).getByRole('button', { name: 'Abrir no editor' }))
    const dialog = within(await screen.findByRole('dialog'))
    await user.click(dialog.getByRole('button', { name: 'Abrir' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/challenges/two-sum'))
    expect(localStorage.getItem('devready-draft:two-sum:JAVA')).toBe(
      'class Solution { /* certo */ }',
    )
    expect(localStorage.getItem('devready-challenge-language')).toBe('JAVA')
  })

  it('simulação acima do objetivo não abre o desafio no editor e diz por quê', async () => {
    const store = storeWithGoal()
    const session = await correctedSimulation(store, 'PLENO')
    const user = userEvent.setup()
    renderRoute(`/sessions/${session.id}/result`, { store })

    const list = within(await screen.findByRole('region', { name: 'Correção item a item' }))
    const { summary, details: challenge } = item(list, '9. Soma de dois números')
    await user.click(summary)

    expect(within(challenge).getByText('Melhor envio: 6 de 6 casos')).toBeInTheDocument()
    expect(
      within(challenge).queryByRole('button', { name: 'Abrir no editor' }),
    ).not.toBeInTheDocument()
    expect(
      within(challenge).getByText(
        'Este desafio é de um nível acima do seu objetivo e não abre na prática.',
      ),
    ).toBeInTheDocument()
  })

  it('simulação no nível do objetivo abre o desafio no editor', async () => {
    const store = storeWithGoal({ ...careerProfile, seniority: 'PLENO' })
    const session = await correctedSimulation(store, 'PLENO')
    const user = userEvent.setup()
    renderRoute(`/sessions/${session.id}/result`, { store })

    const list = within(await screen.findByRole('region', { name: 'Correção item a item' }))
    const { summary, details: challenge } = item(list, '9. Soma de dois números')
    await user.click(summary)

    expect(within(challenge).getByRole('button', { name: 'Abrir no editor' })).toBeInTheDocument()
    expect(within(challenge).queryByText(/acima do seu objetivo/)).not.toBeInTheDocument()
  })

  it('a lição usa a mesma tela, sem nota nem XP de sessão', async () => {
    const store = storeWithGoal()
    const lesson = openLesson()
    for (const [index, q] of lesson.questions.entries()) {
      await answer(store, lesson.id, index + 1, optionOf(q.slug, 'correct').id)
    }
    renderRoute(`/sessions/${lesson.id}/result`, { store })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Resultado da lição' }),
    ).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getByText('4 de 4 questões certas')).toBeInTheDocument()
    expect(main.queryByText('Nota')).not.toBeInTheDocument()
    expect(main.queryByText(/XP/)).not.toBeInTheDocument()
  })

  it('encerrar a primeira simulação leva ao resultado e mostra o aviso da conquista', async () => {
    const session = openSimulation()
    const store = storeWithGoal()
    await answer(store, session.id, 1, optionOf(SIMULATION_QUESTIONS[0], 'correct').id)
    const user = userEvent.setup()
    const { router } = renderRoute(`/sessions/${session.id}`, { store })
    await screen.findByRole('heading', { level: 1, name: 'Simulação · Backend júnior' })

    await user.click(screen.getByRole('button', { name: 'Encerrar' }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Encerrar' }),
    )

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/sessions/${session.id}/result`),
    )
    const region = screen.getByRole('region', { name: /Avisos/ })
    expect(await within(region).findAllByText('Conquista desbloqueada')).not.toHaveLength(0)
    expect(within(region).getByText('Primeira simulação')).toBeInTheDocument()
  })

  it('antes da correção, o resultado diz que ainda não saiu e volta à sessão', async () => {
    const session = openSimulation()
    renderRoute(`/sessions/${session.id}/result`, { store: storeWithGoal() })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'O resultado ainda não saiu' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar à sessão' })).toHaveAttribute(
      'href',
      `/sessions/${session.id}`,
    )
  })
})
