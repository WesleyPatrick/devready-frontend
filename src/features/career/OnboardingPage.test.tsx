import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { makeStore, type AppStore } from '@/app/store'
import { appTexts } from '@/app/texts'
import { sessionStarted } from '@/features/auth/slice'
import { candidate, careerOptions, careerProfile } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { renderRoute } from '@/test/render'
import { server } from '@/test/server'
import { cannons } from '@/lib/motion/celebrate'
import { setReducedMotionForTests } from '@/lib/motion/reducedMotion'
import { careerApi } from './api'

vi.mock('@/lib/motion/celebrate', () => ({
  cannons: vi.fn(() => Promise.resolve()),
  burstFrom: vi.fn(() => Promise.resolve()),
}))

type User = ReturnType<typeof userEvent.setup>

const TITLES = {
  companies: 'Onde você gostaria de trabalhar?',
  stack: 'Com qual stack?',
  seniority: 'Para qual senioridade?',
}
const LIMIT = 'Você já escolheu 5. Desmarque uma para trocar.'
const WHOLE_GROUP = 'Ainda não sei, quero todas deste grupo: Techs brasileiras'

let store: AppStore

async function goToSeniority(user: User) {
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(await screen.findByRole('radio', { name: 'Java e Spring' }))
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await screen.findByRole('heading', { name: TITLES.seniority })
}

async function finishWithNubank(user: User) {
  await user.click(await screen.findByRole('checkbox', { name: 'Nubank' }))
  await goToSeniority(user)
  await user.click(screen.getByRole('radio', { name: /Júnior/ }))
  await user.click(screen.getByRole('button', { name: 'Concluir' }))
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
    server.use(
      http.get('/api/v1/career/profile', () =>
        problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.'),
      ),
    )
  })

  it('leva quem não tem objetivo até a trilha em três passos', async () => {
    let saved: unknown
    server.use(
      http.put('/api/v1/career/profile', async ({ request }) => {
        saved = await request.json()
        return HttpResponse.json(careerProfile)
      }),
    )
    const user = userEvent.setup()
    const { router } = renderRoute('/track', { store })

    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'))
    expect(await screen.findByRole('heading', { name: TITLES.companies })).toHaveFocus()
    const next = screen.getByRole('button', { name: 'Continuar' })
    expect(next).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: 'Nubank' }))
    await user.click(screen.getByRole('checkbox', { name: 'Google' }))
    expect(screen.getByText('2 de 5 escolhidas')).toBeInTheDocument()
    await user.click(next)

    await user.click(await screen.findByRole('radio', { name: 'Java e Spring' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(await screen.findByRole('radio', { name: /Júnior/ }))
    await user.click(screen.getByRole('button', { name: 'Concluir' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    expect(saved).toEqual({
      companies: ['google', 'nubank'],
      stack: 'java-spring',
      seniority: 'JUNIOR',
    })
  })

  it('ao concluir o primeiro objetivo, comemora uma vez, limpa o sinal e a tabela entra em cascata', async () => {
    setReducedMotionForTests(false)
    vi.mocked(cannons).mockClear()
    server.use(http.put('/api/v1/career/profile', () => HttpResponse.json(careerProfile)))
    const user = userEvent.setup()
    const { router } = renderRoute('/onboarding', { store })

    await finishWithNubank(user)

    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    await waitFor(() => expect(cannons).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(router.state.location.state).toBeNull())
    const table = await screen.findByRole('table')
    const rows = (await within(table).findAllByRole('row')).slice(1)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toHaveClass('animate-rise')
    expect(cannons).toHaveBeenCalledTimes(1)
  })

  it('concluir a edição não comemora', async () => {
    setReducedMotionForTests(false)
    vi.mocked(cannons).mockClear()
    server.use(
      http.get('/api/v1/career/profile', () => HttpResponse.json(careerProfile)),
      http.put('/api/v1/career/profile', () => HttpResponse.json(careerProfile)),
    )
    const user = userEvent.setup()
    const { router } = renderRoute('/onboarding?edit=1', { store })

    await screen.findByRole('checkbox', { name: 'Nubank' })
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await user.click(await screen.findByRole('button', { name: 'Continuar' }))
    await user.click(await screen.findByRole('button', { name: 'Concluir' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/profile'))
    expect(router.state.location.state).toBeNull()
    expect(cannons).not.toHaveBeenCalled()
  })

  it('mostra os passos e põe o foco no título de cada um', async () => {
    const user = userEvent.setup()
    renderRoute('/onboarding', { store })

    const steps = await screen.findByRole('list', { name: 'Passos do objetivo' })
    const items = within(steps).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Empresas')
    expect(items[2]).toHaveTextContent('Senioridade')
    expect(items[0]).toHaveAttribute('aria-current', 'step')

    await user.click(await screen.findByRole('checkbox', { name: 'Nubank' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByRole('heading', { name: TITLES.stack })).toHaveFocus()
    expect(within(steps).getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step')
    expect(within(steps).getAllByRole('listitem')[0]).toHaveTextContent('concluído')
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })

  it('mostra as iniciais de cada empresa sem mudar o nome acessível do cartão', async () => {
    renderRoute('/onboarding', { store })

    const card = await screen.findByRole('checkbox', { name: 'Nubank' })
    const monogram = within(card.closest('label')!).getByText('Nu', { exact: true })
    expect(monogram).toHaveAttribute('aria-hidden', 'true')
    const steps = screen.getByRole('list', { name: 'Passos do objetivo' })
    expect(within(steps).getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step')
  })

  it('com cinco marcadas, desabilita as outras e avisa do limite', async () => {
    const user = userEvent.setup()
    renderRoute('/onboarding', { store })

    for (const name of ['Amazon', 'Apple', 'Google', 'Meta', 'Microsoft'])
      await user.click(await screen.findByRole('checkbox', { name }))

    expect(screen.getByText(LIMIT)).toBeInTheDocument()
    expect(screen.queryByText('5 de 5 escolhidas')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Nubank' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Stone' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Google' })).toBeEnabled()

    await user.click(screen.getByRole('checkbox', { name: 'Meta' }))

    expect(screen.getByText('4 de 5 escolhidas')).toBeInTheDocument()
    expect(screen.queryByText(LIMIT)).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Nubank' })).toBeEnabled()
  })

  it('o contador fica no rodapé preso, numa região viva só, e só no passo das empresas', async () => {
    const user = userEvent.setup()
    renderRoute('/onboarding', { store })
    await user.click(await screen.findByRole('checkbox', { name: 'Nubank' }))

    const counter = screen.getByText('1 de 5 escolhidas')
    expect(counter).toHaveAttribute('aria-live', 'polite')
    expect(counter.closest('[data-sticky-footer]')).not.toBeNull()
    expect(counter.closest('form')?.querySelectorAll('[aria-live]')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByRole('heading', { name: TITLES.stack })
    expect(screen.queryByText(/de 5 escolhidas/)).not.toBeInTheDocument()
  })

  it('grava na ordem dos grupos da tela, mesmo que a API devolva outra ordem', async () => {
    let saved: unknown
    server.use(
      http.get('/api/v1/career/options', () =>
        HttpResponse.json({ ...careerOptions, companies: [...careerOptions.companies].reverse() }),
      ),
      http.put('/api/v1/career/profile', async ({ request }) => {
        saved = await request.json()
        return HttpResponse.json(careerProfile)
      }),
    )
    const user = userEvent.setup()
    const { router } = renderRoute('/onboarding', { store })

    await user.click(await screen.findByRole('checkbox', { name: 'Nubank' }))
    await user.click(screen.getByRole('checkbox', { name: 'Amazon' }))
    await user.click(screen.getByRole('checkbox', { name: 'Google' }))
    await goToSeniority(user)
    await user.click(screen.getByRole('radio', { name: /Júnior/ }))
    await user.click(screen.getByRole('button', { name: 'Concluir' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    expect(saved).toEqual({
      companies: ['google', 'amazon', 'nubank'],
      stack: 'java-spring',
      seniority: 'JUNIOR',
    })
  })

  it('"Ainda não sei" marca as cinco do grupo e desmarca as outras', async () => {
    const user = userEvent.setup()
    renderRoute('/onboarding', { store })
    await user.click(await screen.findByRole('checkbox', { name: 'Google' }))

    const brasil = screen.getByRole('group', { name: 'Techs brasileiras' })
    await user.click(within(brasil).getByRole('button', { name: WHOLE_GROUP }))

    for (const name of ['iFood', 'Mercado Livre', 'Nubank', 'PicPay', 'Stone'])
      expect(within(brasil).getByRole('checkbox', { name })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Google' })).not.toBeChecked()
    expect(screen.getByText(LIMIT)).toBeInTheDocument()
  })

  it('cada atalho de grupo tem um nome acessível próprio', async () => {
    renderRoute('/onboarding', { store })
    await screen.findByRole('checkbox', { name: 'Google' })

    const names = screen
      .getAllByRole('button', { name: /^Ainda não sei/ })
      .map((button) => button.getAttribute('aria-label'))
    expect(names).toEqual([
      'Ainda não sei, quero todas deste grupo: Big techs globais',
      'Ainda não sei, quero todas deste grupo: Techs brasileiras',
    ])
  })

  it('Voltar mantém o que já foi escolhido e some no primeiro passo', async () => {
    const user = userEvent.setup()
    renderRoute('/onboarding', { store })
    expect(await screen.findByRole('heading', { name: TITLES.companies })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Voltar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Cancelar' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Nubank' }))
    await goToSeniority(user)
    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(await screen.findByRole('heading', { name: TITLES.stack })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'Java e Spring' })).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(await screen.findByRole('heading', { name: TITLES.companies })).toHaveFocus()
    expect(screen.getByRole('checkbox', { name: 'Nubank' })).toBeChecked()
    expect(screen.getByText('1 de 5 escolhidas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Voltar' })).not.toBeInTheDocument()
  })

  it('agrupa as stacks por área e mostra a frase de cada senioridade', async () => {
    const user = userEvent.setup()
    renderRoute('/onboarding', { store })
    await user.click(await screen.findByRole('checkbox', { name: 'Nubank' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const frontend = await screen.findByRole('group', { name: 'Frontend' })
    expect(within(frontend).getAllByRole('radio')).toHaveLength(2)
    expect(within(frontend).getByRole('radio', { name: 'Angular ou Vue' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('group').map((group) => group.querySelector('legend')?.textContent),
    ).toEqual(['Backend', 'Frontend', 'DevOps'])

    await user.click(within(frontend).getByRole('radio', { name: 'React' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const pleno = await screen.findByRole('radio', { name: 'Pleno' })
    expect(pleno).toHaveAccessibleDescription(
      'Já entrega sozinho. A entrevista cobra decisões de projeto e profundidade na stack.',
    )
  })

  it('mostra "Salvando…" enquanto grava, sem tirar o foco do botão nem gravar duas vezes', async () => {
    let release = () => {}
    const answered = new Promise<void>((resolve) => (release = resolve))
    let calls = 0
    server.use(
      http.put('/api/v1/career/profile', async () => {
        calls += 1
        await answered
        return HttpResponse.json(careerProfile)
      }),
    )
    const user = userEvent.setup()
    const { router } = renderRoute('/onboarding', { store })

    await finishWithNubank(user)

    const button = await screen.findByRole('button', { name: 'Salvando…' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toBeEnabled()
    expect(button).toHaveFocus()
    expect(button.querySelector('svg.animate-spin')).toHaveClass('motion-reduce:animate-none')
    await user.click(button)
    await user.keyboard('{Enter}')
    expect(calls).toBe(1)

    release()
    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
  })

  it('erro 422 ao gravar mostra o detalhe num alerta e mantém a pessoa no último passo', async () => {
    server.use(
      http.put('/api/v1/career/profile', () =>
        problem(422, 'Dados inválidos', 'Empresa desconhecida: nubank.'),
      ),
    )
    const user = userEvent.setup()
    const { router } = renderRoute('/onboarding', { store })

    await finishWithNubank(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Empresa desconhecida: nubank.')
    expect(router.state.location.pathname).toBe('/onboarding')
    expect(screen.getByRole('heading', { name: TITLES.seniority })).toBeInTheDocument()
    const finish = screen.getByRole('button', { name: 'Concluir' })
    expect(finish).toBeEnabled()
    expect(finish).not.toHaveAttribute('aria-disabled')
    expect(finish).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    await screen.findByRole('heading', { name: TITLES.stack })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('sem resposta do servidor ao gravar, mostra o erro de rede', async () => {
    server.use(http.put('/api/v1/career/profile', () => HttpResponse.error()))
    const user = userEvent.setup()
    renderRoute('/onboarding', { store })

    await finishWithNubank(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(appTexts.networkError)
  })

  it('ao concluir, volta para a página que a pessoa tentou abrir', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/simulations/new', { store })
    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'))
    expect(router.state.location.state).toEqual({ from: '/simulations/new' })

    await finishWithNubank(user)

    await waitFor(() => expect(router.state.location.pathname).toBe('/simulations/new'))
    expect(await screen.findByRole('heading', { name: 'Nova simulação' })).toBeInTheDocument()
  })

  it('ao concluir, mantém a busca e o fragmento da página de origem', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute(
      { pathname: '/onboarding', state: { from: '/profile?aba=conta#senha' } },
      { store },
    )

    await finishWithNubank(user)

    await waitFor(() => expect(router.state.location.pathname).toBe('/profile'))
    expect(router.state.location.search).toBe('?aba=conta')
    expect(router.state.location.hash).toBe('#senha')
  })

  it.each([
    '//exemplo.com/profile',
    'https://exemplo.com/profile',
    '/\t/exemplo.com/profile',
    '/onboarding?edit=1',
    '/onboarding/',
    '/Onboarding',
  ])('ao concluir com origem %s, vai para a trilha', async (from) => {
    const user = userEvent.setup()
    const { router } = renderRoute({ pathname: '/onboarding', state: { from } }, { store })

    await finishWithNubank(user)

    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
  })

  it('com ?edit=1, abre com o objetivo atual e volta ao perfil ao concluir', async () => {
    let saved: unknown
    server.use(
      http.get('/api/v1/career/profile', () => HttpResponse.json(careerProfile)),
      http.put('/api/v1/career/profile', async ({ request }) => {
        saved = await request.json()
        return HttpResponse.json(careerProfile)
      }),
    )
    const user = userEvent.setup()
    const { router } = renderRoute('/onboarding?edit=1', { store })

    expect(await screen.findByRole('checkbox', { name: 'Nubank' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Google' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Amazon' })).not.toBeChecked()
    expect(screen.getByText('2 de 5 escolhidas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByRole('radio', { name: 'Java e Spring' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByRole('radio', { name: /Júnior/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Concluir' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/profile'))
    expect(saved).toEqual({
      companies: ['google', 'nubank'],
      stack: 'java-spring',
      seniority: 'JUNIOR',
    })
  })

  it('com ?edit=1, só mostra as opções quando o objetivo atual chega', async () => {
    let release = () => {}
    const answered = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get('/api/v1/career/profile', async () => {
        await answered
        return HttpResponse.json(careerProfile)
      }),
    )
    renderRoute('/onboarding?edit=1', { store })

    const options = careerApi.endpoints.getCareerOptions.select()
    await waitFor(() => expect(options(store.getState()).isSuccess).toBe(true))
    expect(screen.getByRole('status')).toHaveTextContent('Carregando opções…')
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    release()
    expect(await screen.findByRole('checkbox', { name: 'Nubank' })).toBeChecked()
  })

  it('com ?edit=1, falha ao carregar o objetivo mostra o alerta e tenta de novo', async () => {
    server.use(http.get('/api/v1/career/profile', () => HttpResponse.json(careerProfile)))
    server.use(
      http.get('/api/v1/career/profile', () => problem(500, 'Erro', 'Falhou.'), { once: true }),
    )
    const user = userEvent.setup()
    renderRoute('/onboarding?edit=1', { store })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar seu objetivo atual.',
    )
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('checkbox', { name: 'Nubank' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Google' })).toBeChecked()
  })

  it('com ?edit=1, falha nas opções mostra o texto das opções', async () => {
    server.use(
      http.get('/api/v1/career/profile', () => HttpResponse.json(careerProfile)),
      http.get('/api/v1/career/options', () => problem(500, 'Erro', 'Falhou.')),
    )
    renderRoute('/onboarding?edit=1', { store })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as opções.',
    )
  })

  it('quem já tem objetivo e abre /onboarding sem ?edit=1 cai na edição, com o objetivo marcado', async () => {
    server.use(http.get('/api/v1/career/profile', () => HttpResponse.json(careerProfile)))
    const { router } = renderRoute('/onboarding', { store })

    await waitFor(() => expect(router.state.location.search).toBe('?edit=1'))
    expect(router.state.location.pathname).toBe('/onboarding')
    expect(await screen.findByRole('checkbox', { name: 'Nubank' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Google' })).toBeChecked()
    expect(screen.getByRole('link', { name: 'Cancelar' })).toBeInTheDocument()
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('no primeiro preenchimento o 404 é buscado de novo ao abrir a página, sem redirecionar', async () => {
    let gets = 0
    server.use(
      http.get('/api/v1/career/profile', () => {
        gets += 1
        return problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.')
      }),
    )
    const user = userEvent.setup()
    const { router } = renderRoute('/track', { store })

    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'))
    await finishWithNubank(user)

    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    expect(gets).toBe(2)
    expect(router.state.location.search).toBe('')
  })

  it('com ?edit=1, Cancelar volta ao perfil sem gravar', async () => {
    let calls = 0
    server.use(
      http.get('/api/v1/career/profile', () => HttpResponse.json(careerProfile)),
      http.put('/api/v1/career/profile', () => {
        calls += 1
        return HttpResponse.json(careerProfile)
      }),
    )
    const user = userEvent.setup()
    const { router } = renderRoute('/onboarding?edit=1', { store })

    await user.click(await screen.findByRole('link', { name: 'Cancelar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/profile'))
    expect(router.state.historyAction).toBe('REPLACE')
    expect(calls).toBe(0)
  })

  it('mostra carregando e, se as opções falharem, um alerta com nova tentativa', async () => {
    server.use(
      http.get('/api/v1/career/options', () => problem(500, 'Erro', 'Falhou.'), { once: true }),
    )
    const user = userEvent.setup()
    renderRoute('/onboarding', { store })

    expect(await screen.findByRole('status')).toHaveTextContent('Carregando opções…')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as opções.',
    )
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('checkbox', { name: 'Nubank' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
