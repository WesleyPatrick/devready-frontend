import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http } from 'msw'
import { challengePath } from '@/app/paths'
import { cannons } from '@/lib/motion/celebrate'
import { setReducedMotionForTests } from '@/lib/motion/reducedMotion'
import {
  COMPILE_OUTPUT,
  nextOutcome,
  pauseSubmissions,
  resumeSubmissions,
  stepSubmissions,
  TWO_SUM_STARTERS,
} from '@/test/challenge'
import { careerProfile } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { practiceStatus } from '@/test/practice'
import { renderRoute, storeWithGoal } from '@/test/render'
import { openSimulation } from '@/test/session'
import { server } from '@/test/server'

vi.mock('@/lib/motion/celebrate', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/motion/celebrate')>()),
  cannons: vi.fn(() => Promise.resolve()),
}))

async function openChallenge(slug = 'two-sum', store = storeWithGoal()) {
  const result = renderRoute(challengePath(slug), { store })
  const editor = await screen.findByRole('textbox', { name: 'Código' })
  return { user: userEvent.setup(), editor, ...result }
}

const code = () => screen.getByRole('textbox', { name: 'Código' })
const button = (name: string) => screen.getByRole('button', { name })
const resultPanel = () => screen.getByRole('tabpanel', { name: 'Resultado' })
const headerOf = () => screen.getByRole('heading', { level: 1 }).closest('header')!

async function pickLanguage(user: UserEvent, label: string) {
  await user.click(screen.getByRole('combobox', { name: 'Linguagem' }))
  await user.click(await screen.findByRole('option', { name: label }))
}

function stubPhone() {
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
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(cannons).mockClear()
})
afterEach(() => vi.unstubAllGlobals())

describe('ChallengePage', () => {
  it('abre com cabeçalho, exemplos, a linguagem da stack e o código inicial, ocupando a tela', async () => {
    const { editor } = await openChallenge()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Soma de dois números')
    const header = headerOf()
    expect(within(header).getByRole('link', { name: 'Questões' })).toHaveAttribute(
      'href',
      '/questions',
    )
    expect(header).toHaveTextContent('Fácil')
    expect(header).toHaveTextContent('Estruturas de dados e algoritmos')
    expect(header).toHaveTextContent('+40 XP')
    expect(within(header).getByText('Não iniciada')).toHaveClass('sr-only')
    expect(screen.getByText('Exemplo 1')).toBeInTheDocument()
    expect(screen.getByText('Exemplo 2')).toBeInTheDocument()
    expect(screen.getByText('Mais 4 casos ocultos no envio.')).toBeInTheDocument()
    expect(screen.getByText('Tempo: 5 s para todos os casos juntos.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Abordagem' })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Linguagem' })).toHaveTextContent('Java 13')
    expect(editor).toHaveValue(TWO_SUM_STARTERS.JAVA)
    expect(screen.getByRole('main')).not.toHaveClass('max-w-7xl')
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })

  it('a stack de React começa em JavaScript; depois vale a última linguagem escolhida', async () => {
    const react = storeWithGoal({
      ...careerProfile,
      stack: { slug: 'react', name: 'React', area: 'frontend' },
    })
    const first = await openChallenge('two-sum', react)
    expect(first.editor).toHaveValue(TWO_SUM_STARTERS.JAVASCRIPT)
    expect(screen.getByRole('combobox', { name: 'Linguagem' })).toHaveTextContent('Node 12')

    await pickLanguage(first.user, 'Python 3.8')
    first.unmount()

    const second = await openChallenge('two-sum', react)
    expect(second.editor).toHaveValue(TWO_SUM_STARTERS.PYTHON)
  })

  it('cada linguagem guarda o próprio rascunho, também depois de sair da página', async () => {
    const { user, unmount } = await openChallenge()
    await user.clear(code())
    await user.type(code(), 'rascunho em Java')

    await pickLanguage(user, 'Python 3.8')
    expect(code()).toHaveValue(TWO_SUM_STARTERS.PYTHON)
    await user.clear(code())
    await user.type(code(), 'rascunho em Python')
    await pickLanguage(user, 'Java 13')

    expect(code()).toHaveValue('rascunho em Java')
    expect(localStorage.getItem('devready-draft:two-sum:PYTHON')).toBe('rascunho em Python')
    unmount()
    const again = await openChallenge()
    expect(again.editor).toHaveValue('rascunho em Java')
  })

  it('rodar mostra a fila e a execução, roda só os visíveis e não conta no progresso', async () => {
    const { user } = await openChallenge()
    pauseSubmissions()

    await user.click(button('Rodar'))
    expect(await within(resultPanel()).findByText('Na fila…')).toBeInTheDocument()
    expect(button('Rodar')).toHaveAttribute('aria-disabled', 'true')
    expect(button('Enviar')).toHaveAttribute('aria-disabled', 'true')
    await user.click(button('Enviar'))
    await waitFor(() => expect(stepSubmissions()).toBe(1))
    expect(await within(resultPanel()).findByText('Rodando…')).toBeInTheDocument()
    resumeSubmissions()

    expect(await screen.findByText('Passou nos 2 casos visíveis.')).toBeInTheDocument()
    const panel = resultPanel()
    expect(within(panel).getByText('Passou nos casos visíveis')).toBeInTheDocument()
    expect(within(panel).getAllByRole('button', { name: /^Caso \d: passou$/ })).toHaveLength(2)
    expect(button('Rodar')).not.toHaveAttribute('aria-disabled')
    expect(cannons).not.toHaveBeenCalled()
    expect(practiceStatus('two-sum')).toBe('NOT_STARTED')
    await user.click(screen.getByRole('tab', { name: 'Envios' }))
    expect(await screen.findByText(/Nenhum envio ainda/)).toBeInTheDocument()
  })

  it('o andamento para no estado final: nenhuma pergunta nova depois do veredito', async () => {
    let asked = 0
    server.events.on('request:start', ({ request }) => {
      if (/\/api\/v1\/submissions\/[^/]+$/.test(new URL(request.url).pathname)) asked += 1
    })
    try {
      const { user } = await openChallenge()
      await user.click(button('Rodar'))
      await screen.findByText('Passou nos 2 casos visíveis.')
      await waitFor(() => expect(button('Rodar')).not.toHaveAttribute('aria-disabled'))
      const atVerdict = asked

      await expect(
        vi.waitFor(() => expect(asked).toBeGreaterThan(atVerdict), { timeout: 300, interval: 20 }),
      ).rejects.toThrow()
    } finally {
      server.events.removeAllListeners()
    }
  })

  it('enviar certo: canhões, "+XP" subindo, XP novo no topo, desafio resolvido e a abordagem', async () => {
    setReducedMotionForTests(false)
    const { user } = await openChallenge()

    await user.click(button('Enviar'))

    expect(await screen.findByText('Aceito: 6 de 6 casos. Mais 40 XP.')).toBeInTheDocument()
    const panel = resultPanel()
    expect(within(panel).getByText('Aceito')).toBeInTheDocument()
    expect(within(panel).getByText('6 de 6 casos')).toBeInTheDocument()
    expect(panel.querySelector('[data-slot="xp-float"]')).toHaveTextContent('+40 XP')
    expect(cannons).toHaveBeenCalledTimes(1)
    expect(await screen.findByTitle('1.280 XP')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Abordagem' })).toBeInTheDocument()
    expect(await within(headerOf()).findByText('Resolvida')).toHaveClass('sr-only')
    expect(practiceStatus('two-sum')).toBe('SOLVED')
    expect(cannons).toHaveBeenCalledTimes(1)
  })

  it('enviar de novo um desafio resolvido comemora sem "+XP" e avisa que o XP não soma', async () => {
    setReducedMotionForTests(false)
    const { user } = await openChallenge()
    await user.click(button('Enviar'))
    await screen.findByText('Aceito: 6 de 6 casos. Mais 40 XP.')

    await user.click(button('Enviar'))

    expect(await screen.findByText('Aceito: 6 de 6 casos.')).toBeInTheDocument()
    expect(within(resultPanel()).getByText(/o XP não soma de novo/)).toBeInTheDocument()
    expect(resultPanel().querySelector('[data-slot="xp-float"]')).toBeNull()
    expect(cannons).toHaveBeenCalledTimes(2)
  })

  it('envio errado: "4 de 6 casos", o primeiro visível que falhou aberto, ocultos só com ícone', async () => {
    setReducedMotionForTests(false)
    const { user } = await openChallenge()
    nextOutcome('FAILED')

    await user.click(button('Enviar'))

    expect(await screen.findByText('Falhou: 4 de 6 casos.')).toBeInTheDocument()
    const panel = resultPanel()
    expect(within(panel).getByText('Falhou')).toBeInTheDocument()
    expect(within(panel).getByText('4 de 6 casos')).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Caso 2: falhou' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const details = within(panel).getByText('Obtido').closest('dl')!
    expect(details).toHaveTextContent('[3,2,4]')
    expect(details).toHaveTextContent('[1,2]')
    expect(within(panel).getByText('Caso 4, oculto: falhou')).toHaveClass('sr-only')
    expect(within(panel).queryByRole('button', { name: /Caso 4/ })).not.toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'Caso 1: passou' }))
    expect(within(panel).getByText('Obtido').closest('dl')).toHaveTextContent('[0,1]')
    expect(cannons).not.toHaveBeenCalled()
    expect(panel.querySelector('.animate-shake')).toBeNull()
    expect(practiceStatus('two-sum')).toBe('ATTEMPTED')
  })

  it('Ctrl+Enter no editor roda; erro de compilação mostra a saída do compilador', async () => {
    const { user, editor } = await openChallenge()
    nextOutcome('COMPILE_ERROR')

    await user.click(editor)
    await user.keyboard('{Control>}{Enter}{/Control}')

    expect(await screen.findByText('Erro de compilação.')).toBeInTheDocument()
    expect(within(resultPanel()).getByText(COMPILE_OUTPUT)).toBeInTheDocument()
    expect(practiceStatus('two-sum')).toBe('NOT_STARTED')
  })

  it('429 vira o aviso de muitas execuções, e os botões voltam', async () => {
    server.use(
      http.post('/api/v1/challenges/:slug/runs', () =>
        problem(429, 'Muitas requisições', 'Muitas tentativas. Tente de novo em instantes.'),
      ),
    )
    const { user } = await openChallenge()

    await user.click(button('Rodar'))

    expect(
      await within(resultPanel()).findByText('Muitas execuções seguidas. Espere alguns segundos.'),
    ).toBeInTheDocument()
    expect(button('Rodar')).not.toHaveAttribute('aria-disabled')
  })

  it('restaurar o código inicial pede confirmação e apaga o rascunho', async () => {
    const { user } = await openChallenge()
    await user.clear(code())
    await user.type(code(), 'rascunho')

    await user.click(button('Restaurar código inicial'))
    const dialog = await screen.findByRole('dialog', { name: 'Restaurar o código inicial?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(code()).toHaveValue('rascunho')

    await user.click(button('Restaurar código inicial'))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Restaurar' }),
    )
    expect(code()).toHaveValue(TWO_SUM_STARTERS.JAVA)
    expect(localStorage.getItem('devready-draft:two-sum:JAVA')).toBeNull()
  })

  it('Envios lista só os envios, e "Abrir no editor" troca o código daquela linguagem', async () => {
    const { user } = await openChallenge()
    await pickLanguage(user, 'Python 3.8')
    await user.clear(code())
    await user.type(code(), 'resposta em Python')
    await user.click(button('Enviar'))
    await screen.findByText('Aceito: 6 de 6 casos. Mais 40 XP.')
    await user.clear(code())
    await user.type(code(), 'rascunho novo')
    await user.click(button('Rodar'))
    await screen.findByText('Passou nos 2 casos visíveis.')
    await pickLanguage(user, 'Java 13')

    await user.click(screen.getByRole('tab', { name: 'Envios' }))
    const list = await screen.findByRole('list', { name: 'Envios do desafio' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('Aceito')
    expect(items[0]).toHaveTextContent('Python · 6 de 6 casos')
    await user.click(within(items[0]).getByRole('button', { name: /Abrir no editor/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Abrir este envio no editor?' })
    expect(dialog).toHaveTextContent('O código de Python no editor')
    await user.click(within(dialog).getByRole('button', { name: 'Abrir' }))

    await waitFor(() => expect(code()).toHaveValue('resposta em Python'))
    expect(screen.getByRole('combobox', { name: 'Linguagem' })).toHaveTextContent('Python 3.8')
    expect(localStorage.getItem('devready-draft:two-sum:PYTHON')).toBe('resposta em Python')
  })

  it('no celular, três abas; o editor continua montado, e rodar abre o resultado', async () => {
    stubPhone()
    const { user, editor } = await openChallenge()
    const areas = screen.getByRole('tablist', { name: 'Áreas do desafio' })
    expect(
      within(areas)
        .getAllByRole('tab')
        .map((tab) => tab.textContent),
    ).toEqual(['Enunciado', 'Código', 'Resultado'])
    expect(within(areas).getByRole('tab', { name: 'Código' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.clear(editor)
    await user.type(editor, 'rascunho no celular')

    await user.click(within(areas).getByRole('tab', { name: 'Enunciado' }))
    expect(editor).not.toBeVisible()
    expect(screen.getByText('Exemplo 1')).toBeVisible()
    await user.click(within(areas).getByRole('tab', { name: 'Código' }))
    expect(editor).toBeVisible()
    expect(editor).toHaveValue('rascunho no celular')

    await user.click(button('Rodar'))
    await waitFor(() =>
      expect(within(areas).getByRole('tab', { name: 'Resultado' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    )
    expect(await screen.findByText('Passou nos 2 casos visíveis.')).toBeInTheDocument()
  })

  it('desafio que não existe mostra "Desafio não encontrado", com volta para Questões', async () => {
    renderRoute(challengePath('nao-existe'), { store: storeWithGoal() })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Desafio não encontrado' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para Questões' })).toHaveAttribute(
      'href',
      '/questions',
    )
  })

  it('aberta pelo endereço durante a simulação, a página diz que o desafio está em prova e leva à simulação', async () => {
    const session = openSimulation()
    renderRoute(challengePath('two-sum'), { store: storeWithGoal() })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Desafio em prova' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Este desafio está na sua simulação em andamento.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continuar a simulação' })).toHaveAttribute(
      'href',
      `/sessions/${session.id}`,
    )
    expect(screen.queryByRole('textbox', { name: 'Código' })).not.toBeInTheDocument()
  })

  it('a lista de envios responde 409 durante a simulação e 404 acima do nível', async () => {
    const session = openSimulation()
    const locked = await fetch('/api/v1/challenges/two-sum/submissions', {
      headers: { Authorization: 'Bearer t' },
    })
    expect(locked.status).toBe(409)
    expect((await locked.json()).sessionId).toBe(session.id)

    const missing = await fetch('/api/v1/challenges/desconhecido/submissions', {
      headers: { Authorization: 'Bearer t' },
    })
    expect(missing.status).toBe(404)
  })
})
