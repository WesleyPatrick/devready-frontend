import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import type { Level } from '@/lib/learning'
import { candidate, careerProfile } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { optionOf, practiceProblem, setPracticeSeniority } from '@/test/practice'
import { renderRoute } from '@/test/render'
import { openSimulation, SIMULATION_QUESTIONS } from '@/test/session'
import { server } from '@/test/server'
import { questionsApi } from './api'
import { PAGE_SIZE } from './paging'
import type { QuestionPage } from './types'

const DAILY = 'backend-junior-java-equals-hashcode'

async function renderQuestions(path = '/questions') {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
  const result = renderRoute(path, { store })
  await screen.findByRole('navigation', { name: 'Navegação principal' })
  await screen.findByRole('heading', { level: 1, name: 'Questões' })
  return { user: userEvent.setup(), ...result }
}

const CAPTION = 'Problemas da sua trilha'
const table = () => screen.findByRole('table', { name: CAPTION })

function dataRows() {
  return within(screen.getByRole('table')).getAllByRole('row').slice(1)
}

function rowOf(slug: string) {
  const title = practiceProblem(slug).title.replaceAll('`', '')
  return dataRows().find((row) => row.textContent?.includes(title))!
}

async function expectRowCount(count: number) {
  await waitFor(() => expect(dataRows().length).toBe(count))
}

function holdNextList() {
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  server.use(
    http.get(
      '/api/v1/questions',
      async () => {
        await gate
      },
      { once: true },
    ),
  )
  return () => release()
}

function asSeniority(level: Level) {
  setPracticeSeniority(level)
  server.use(
    http.get('/api/v1/career/profile', () =>
      HttpResponse.json({ ...careerProfile, seniority: level }),
    ),
  )
}

describe('QuestionsPage', () => {
  it('lista 10 por página, sem etiqueta de prévia, com paginação e página na URL', async () => {
    const { user, router } = await renderQuestions()
    await table()
    expect(screen.queryByText('Prévia')).not.toBeInTheDocument()
    await expectRowCount(10)
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    await expectRowCount(6)
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?page=2')
    const next = screen.getByRole('button', { name: 'Próxima página' })
    expect(next).toHaveAttribute('aria-disabled', 'true')
    next.focus()
    expect(next).toHaveFocus()
    await user.click(next)
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?page=2')
  })

  it('pede a página com o tamanho de página da tela', async () => {
    const { store } = await renderQuestions()
    await table()
    const select = questionsApi.endpoints.getQuestions.select({ page: 1, size: PAGE_SIZE })
    expect(select(store.getState()).isSuccess).toBe(true)
  })

  it('a aba Resolvidas deixa só as resolvidas', async () => {
    const { user } = await renderQuestions()
    await table()
    await user.click(screen.getByRole('tab', { name: /Resolvidas/ }))
    await expectRowCount(3)
    for (const row of dataRows()) expect(within(row).getByText('Resolvida')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument()
  })

  it('o filtro de dificuldade Fácil deixa só linhas fáceis e volta para a página 1', async () => {
    const { user, router } = await renderQuestions('/questions?page=2')
    await table()
    await user.click(screen.getByRole('button', { name: /Dificuldade/ }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Fácil' }))
    await waitFor(() => expect(router.state.location.search).not.toContain('page'))
    await expectRowCount(7)
    for (const row of dataRows()) expect(within(row).getByText('Fácil')).toBeInTheDocument()
  })

  it('o filtro de competência traz as competências da trilha', async () => {
    const { user, router } = await renderQuestions()
    await table()
    await user.click(screen.getByRole('button', { name: /Competência/ }))
    expect(await screen.findByRole('menuitemradio', { name: 'Kotlin' })).toBeInTheDocument()
    await user.click(screen.getByRole('menuitemradio', { name: 'SQL e modelagem de dados' }))
    await waitFor(() =>
      expect(router.state.location.search).toBe('?competency=sql-e-modelagem-de-dados'),
    )
    await expectRowCount(4)
    for (const row of dataRows()) {
      expect(within(row).getAllByText('SQL e modelagem de dados').length).toBeGreaterThan(0)
    }
  })

  it('abre o diálogo pelo título; acertar soma XP na barra e a linha vira Resolvida', async () => {
    const { user } = await renderQuestions()
    await table()
    expect(within(rowOf(DAILY)).getByText('Não iniciada')).toBeInTheDocument()
    await user.click(within(rowOf(DAILY)).getByRole('button'))
    await user.click(await screen.findByRole('radio', { name: optionOf(DAILY, 'correct').label }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText('Acertou! +40 XP')
    await user.click(screen.getAllByRole('button', { name: 'Fechar' })[0])
    await waitFor(() => expect(screen.getAllByText(/^1\.280 XP/).length).toBeGreaterThan(0))
    await waitFor(() => expect(within(rowOf(DAILY)).getByText('Resolvida')).toBeInTheDocument())
  })

  it('o acerto sai em mono e por extenso para leitor de tela', async () => {
    await renderQuestions()
    await table()
    const row = rowOf('backend-junior-sql-inner-join')
    expect(within(row).getByText('62% de acerto')).toHaveClass('sr-only')
    expect(within(row).getByText('62%')).toHaveClass('font-mono')
  })

  it('taxa e competência sem valor aparecem como "—", com o motivo para leitor de tela', async () => {
    const page: QuestionPage = {
      items: [
        {
          slug: 'backend-junior-java-checked-exceptions',
          type: 'QUESTION',
          title: 'Exceção verificada ou não verificada',
          competency: null,
          difficulty: 'EASY',
          level: 'JUNIOR',
          status: 'NOT_STARTED',
          acceptance: null,
          askedBy: [],
          inExam: false,
        },
      ],
      page: 1,
      totalPages: 1,
      totalItems: 1,
    }
    server.use(http.get('/api/v1/questions', () => HttpResponse.json(page)))
    await renderQuestions()
    await table()
    await expectRowCount(1)
    const row = dataRows()[0]
    expect(within(row).getAllByText('—')).toHaveLength(2)
    for (const dash of within(row).getAllByText('—')) {
      expect(dash).toHaveAttribute('aria-hidden', 'true')
    }
    expect(within(row).getByText('Sem competência ligada')).toHaveClass('sr-only')
    expect(within(row).getByText('Taxa de acerto: ainda poucas respostas')).toHaveClass('sr-only')
  })

  it('mostra o erro junto da tabela quando a consulta seguinte falha, e dá para tentar de novo', async () => {
    const { user } = await renderQuestions()
    await table()
    server.use(
      http.get('/api/v1/questions', () => problem(500, 'Erro interno', 'Falhou.'), {
        once: true,
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(await screen.findByText('Não foi possível carregar as questões.')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: CAPTION })).toBeInTheDocument()
    const release = holdNextList()
    const retry = screen.getByRole('button', { name: 'Tentar de novo' })
    await user.click(retry)
    await waitFor(() => expect(retry).toHaveAttribute('aria-disabled', 'true'))
    expect(retry).toHaveFocus()
    release()
    await waitFor(() =>
      expect(screen.queryByText('Não foi possível carregar as questões.')).not.toBeInTheDocument(),
    )
  })

  it('marca a tabela como ocupada enquanto a nova consulta não volta', async () => {
    const { user } = await renderQuestions()
    await table()
    const release = holdNextList()
    const region = () => screen.getByRole('table').closest('[aria-busy]')
    expect(region()).toBeNull()
    expect(screen.queryByText('Atualizando…')).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Resolvidas/ }))
    await waitFor(() => expect(region()).toHaveAttribute('aria-busy', 'true'))
    expect(region()).not.toHaveClass('opacity-60')
    expect(screen.getByRole('status')).toHaveTextContent('Atualizando…')
    release()
    await expectRowCount(3)
    await waitFor(() => expect(screen.getByRole('table').closest('[aria-busy]')).toBeNull())
    expect(screen.queryByText('Atualizando…')).not.toBeInTheDocument()
  })

  it('em Não iniciadas, a questão respondida sai da lista e o foco vai para o painel das abas', async () => {
    const { user } = await renderQuestions('/questions?status=NOT_STARTED')
    await table()
    const row = rowOf(DAILY)
    await user.click(within(row).getByRole('button'))
    await user.click(await screen.findByRole('radio', { name: optionOf(DAILY, 'correct').label }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText(/^Acertou!/)
    await waitFor(() => expect(row).not.toBeInTheDocument())
    await user.click(screen.getAllByRole('button', { name: 'Fechar' }).at(-1)!)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('cada linha diz o tipo; o desafio é um link para a página dele', async () => {
    const { user, router } = await renderQuestions()
    await table()
    const challenge = rowOf('valid-parentheses')
    expect(within(challenge).getByText('Desafio de código')).toHaveClass('sr-only')
    expect(challenge.querySelector('svg.lucide-square-code')).not.toBeNull()
    const link = within(challenge).getByRole('link', { name: /Parênteses balanceados/ })
    expect(link).toHaveAttribute('href', '/challenges/valid-parentheses')
    expect(within(challenge).queryByText(/em breve/i)).not.toBeInTheDocument()
    const question = rowOf(DAILY)
    expect(within(question).getByText('Questão objetiva')).toHaveClass('sr-only')
    expect(question.querySelector('svg.lucide-list-checks')).not.toBeNull()
    expect(within(question).getByRole('button')).toBeInTheDocument()
    expect(within(question).queryByRole('link')).not.toBeInTheDocument()
    await user.click(link)
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/challenges/valid-parentheses'),
    )
  })

  it('o filtro de tipo deixa só os desafios, vai para a URL e volta para a página 1', async () => {
    const { user, router } = await renderQuestions('/questions?page=2')
    await table()
    await user.click(screen.getByRole('button', { name: /Tipo/ }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Desafios de código' }))
    await waitFor(() => expect(router.state.location.search).toBe('?type=CHALLENGE'))
    await expectRowCount(4)
    for (const row of dataRows()) {
      expect(within(row).getByRole('link')).toHaveAttribute(
        'href',
        expect.stringMatching(/^\/challenges\//),
      )
    }
  })

  it('um tipo desconhecido na URL é ignorado', async () => {
    const { store } = await renderQuestions('/questions?type=OUTRO')
    await table()
    await expectRowCount(10)
    const select = questionsApi.endpoints.getQuestions.select({ page: 1, size: PAGE_SIZE })
    expect(select(store.getState()).isSuccess).toBe(true)
  })

  it('os desafios da simulação aberta aparecem "Em prova", sem link; os outros continuam links', async () => {
    openSimulation()
    await renderQuestions('/questions?type=CHALLENGE')
    await table()

    const locked = within(rowOf('two-sum'))
    expect(locked.getByText('Em prova')).toBeInTheDocument()
    expect(locked.queryByRole('link')).not.toBeInTheDocument()
    expect(within(rowOf('merge-sorted-arrays')).getByRole('link')).toHaveAttribute(
      'href',
      '/challenges/merge-sorted-arrays',
    )
  })

  it('as objetivas da simulação aberta aparecem "Em prova", sem abrir o diálogo; as outras continuam botões', async () => {
    openSimulation()
    const { user } = await renderQuestions('/questions?type=QUESTION')
    await table()

    const locked = within(rowOf(SIMULATION_QUESTIONS[0]))
    expect(locked.getByText('Em prova')).toBeInTheDocument()
    expect(locked.getByText(/na sua simulação em andamento/)).toHaveClass('sr-only')
    expect(locked.queryByRole('button')).not.toBeInTheDocument()
    expect(locked.queryByRole('link')).not.toBeInTheDocument()
    const free = dataRows().find((row) => within(row).queryByRole('button'))
    expect(free).toBeDefined()
    await user.click(within(free!).getByRole('button'))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
  it('com o objetivo Júnior, não há coluna nem filtro de nível', async () => {
    await renderQuestions()
    await table()
    await expectRowCount(10)
    expect(screen.queryByRole('columnheader', { name: 'Nível' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Nível/ })).not.toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryByText('Júnior')).not.toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  })

  it('com o objetivo Pleno, a coluna mostra o nível e o filtro tem Júnior e Pleno', async () => {
    asSeniority('PLENO')
    const { user, router } = await renderQuestions()
    await table()
    expect(screen.getByRole('columnheader', { name: 'Nível' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Nível/ }))
    expect(await screen.findByRole('menuitemradio', { name: 'Júnior' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitemradio', { name: 'Sênior' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitemradio', { name: 'Pleno' }))
    await waitFor(() => expect(router.state.location.search).toBe('?level=PLENO'))
    await expectRowCount(2)
    for (const row of dataRows()) expect(within(row).getAllByText('Pleno')).toHaveLength(2)
  })

  it('abaixo de sm, a coluna Nível some e o nível vai para debaixo do título', async () => {
    asSeniority('PLENO')
    await renderQuestions()
    await table()
    const header = screen.getByRole('columnheader', { name: 'Nível' })
    expect(header).toHaveClass('hidden', 'sm:table-cell')

    const cells = within(rowOf('backend-pleno-transaction-isolation')).getAllByRole('cell')
    const column = cells[(header as HTMLTableCellElement).cellIndex]
    expect(column).toHaveClass('hidden', 'sm:table-cell')
    expect(within(column).getByText('Pleno')).toBeInTheDocument()
    expect(within(column).queryByText('Nível:')).not.toBeInTheDocument()
    const belowTitle = within(cells[2]).getByText('Pleno').closest('.sm\\:hidden')
    expect(belowTitle).toHaveClass('block', 'sm:hidden')
    expect(within(belowTitle as HTMLElement).getByText('Nível:')).toHaveClass('sr-only')
    const junior = within(rowOf(DAILY)).getAllByRole('cell')[2]
    expect(within(junior).getByText('Júnior').closest('.sm\\:hidden')).not.toBeNull()
  })

  it('com o objetivo Sênior, o filtro tem os três níveis', async () => {
    asSeniority('SENIOR')
    const { user } = await renderQuestions('/questions?level=SENIOR')
    await table()
    await expectRowCount(1)
    expect(within(dataRows()[0]).getAllByText('Sênior')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: /^Nível/ }))
    for (const name of ['Júnior', 'Pleno', 'Sênior']) {
      expect(await screen.findByRole('menuitemradio', { name })).toBeInTheDocument()
    }
  })

  it('um nível acima do objetivo na URL é ignorado e não vai para a API', async () => {
    const { store } = await renderQuestions('/questions?level=SENIOR')
    await table()
    await expectRowCount(10)
    const select = questionsApi.endpoints.getQuestions.select({ page: 1, size: PAGE_SIZE })
    expect(select(store.getState()).isSuccess).toBe(true)
  })
})
