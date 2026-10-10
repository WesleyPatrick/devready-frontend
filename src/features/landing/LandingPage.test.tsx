import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, vi } from 'vitest'
import { careerOptions } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { anonymousStore, renderRoute } from '@/test/render'
import { server } from '@/test/server'
import { landingTexts } from './texts'

const t = landingTexts

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('LandingPage', () => {
  it('abre com o título que promete a trilha das empresas escolhidas', () => {
    renderRoute('/', { store: anonymousStore() })

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Treine para a entrevista técnica das empresas que você quer.',
      }),
    ).toBeInTheDocument()
  })

  it('leva a montar a trilha no cadastro e a ver como funciona na âncora', () => {
    renderRoute('/', { store: anonymousStore() })

    expect(screen.getByRole('link', { name: t.hero.primary })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: t.hero.secondary })).toHaveAttribute(
      'href',
      '#como-funciona',
    )
  })

  it('promete no futuro a trilha feita de vagas e descreve lições e simulações no presente', () => {
    renderRoute('/', { store: anonymousStore() })

    expect(screen.getByText(/A trilha vai mostrar o que as vagas delas pedem/)).toBeInTheDocument()
    expect(
      screen.getByText(/As trilhas usam uma primeira leva de vagas públicas/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/lições curtas por competência e simulações com tempo marcado\.$/),
    ).toBeInTheDocument()
  })

  it('mostra os fatos: empresas da base, áreas e senioridades', async () => {
    renderRoute('/', { store: anonymousStore() })

    expect(await screen.findByText('10 empresas')).toBeInTheDocument()
    expect(screen.getByText('3 áreas')).toBeInTheDocument()
    expect(screen.getByText('júnior, pleno e sênior')).toBeInTheDocument()
  })

  it('mostra a prévia como tabela de exemplo, com uma linha por competência', () => {
    renderRoute('/', { store: anonymousStore() })

    const table = screen.getByRole('table', { name: /exemplo/i })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(5)
    for (const row of t.example.rows) {
      expect(within(table).getByText(row.name)).toBeInTheDocument()
    }
    expect(within(table).getAllByText('Pedido em 70 de 100 vagas')).toHaveLength(2)
    expect(within(table).getByText('80/100')).toHaveClass('font-mono')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('lista as empresas da base pelos nomes', async () => {
    renderRoute('/', { store: anonymousStore() })

    const companies = await screen.findByRole('region', { name: t.companies.title })
    for (const company of careerOptions.companies) {
      expect(await within(companies).findByText(company.name)).toBeInTheDocument()
    }
    expect(companies).toHaveAttribute('id', 'empresas')
  })

  it('mostra que está carregando as empresas enquanto a API não responde', async () => {
    let release = () => {}
    const answered = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get('/api/v1/career/options', async () => {
        await answered
        return HttpResponse.json(careerOptions)
      }),
    )
    renderRoute('/', { store: anonymousStore() })

    const companies = screen.getByRole('region', { name: t.companies.title })
    expect(await within(companies).findByRole('status')).toHaveTextContent(t.companies.loading)
    release()
    expect(await within(companies).findByText('Nubank')).toBeInTheDocument()
    expect(within(companies).queryByRole('status')).not.toBeInTheDocument()
  })

  it('some com a seção de empresas se a API falhar, sem quebrar a página', async () => {
    server.use(http.get('/api/v1/career/options', () => problem(500, 'Erro', 'Falhou.')))
    renderRoute('/', { store: anonymousStore() })

    await waitFor(() => expect(screen.queryByText(t.companies.loading)).not.toBeInTheDocument())
    expect(screen.queryByText('Nubank')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: t.companies.title })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('some com a seção quando a base ainda não tem empresas', async () => {
    server.use(
      http.get('/api/v1/career/options', () =>
        HttpResponse.json({ ...careerOptions, companies: [] }),
      ),
    )
    renderRoute('/', { store: anonymousStore() })

    await waitFor(() =>
      expect(screen.queryByRole('region', { name: t.companies.title })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('region', { name: t.how.title })).toBeInTheDocument()
  })

  it('explica em três passos numa lista ordenada, sem prometer etapa futura', () => {
    renderRoute('/', { store: anonymousStore() })

    const how = screen.getByRole('region', { name: t.how.title })
    expect(how).toHaveAttribute('id', 'como-funciona')
    const steps = within(within(how).getByRole('list')).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(steps[0].closest('ol')).not.toBeNull()
    const note = within(how).getByText(/primeira leva de vagas públicas/i)
    expect(note).toHaveTextContent(/as lições, as simulações e o progresso contam/i)
    expect(note).not.toHaveTextContent(/prévia|dados de exemplo|próxima etapa|até a pesquisa/i)
  })

  it('termina com a chamada para criar conta, sem faixa colorida', () => {
    renderRoute('/', { store: anonymousStore() })

    const cta = screen.getByRole('region', { name: t.cta.title })
    expect(within(cta).getByRole('link', { name: t.cta.action })).toHaveAttribute(
      'href',
      '/register',
    )
    const banded = screen
      .getByRole('main')
      .querySelectorAll('section.bg-primary, section > div.bg-primary')
    expect(banded).toHaveLength(0)
  })
})

describe('LandingPage, âncoras', () => {
  it('não quebra com hash malformado', () => {
    renderRoute('/#%E0%A4%A', { store: anonymousStore() })

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('rola até a seção do hash ao abrir a rota', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderRoute('/#como-funciona', { store: anonymousStore() })

    await waitFor(() => expect(scroll).toHaveBeenCalled())
    const target = scroll.mock.contexts.at(-1) as Element
    expect(target.id).toBe('como-funciona')
  })

  it('rola até as empresas só depois de a seção aparecer', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderRoute('/#empresas', { store: anonymousStore() })

    await screen.findByRole('region', { name: t.companies.title })
    await waitFor(() =>
      expect(scroll.mock.contexts.some((el) => (el as Element).id === 'empresas')).toBe(true),
    )
  })

  it('rola quando o link do cabeçalho é clicado vindo do login', async () => {
    const user = userEvent.setup()
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderRoute('/login', { store: anonymousStore() })

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    await user.click(within(nav).getByRole('link', { name: 'Como funciona' }))

    await waitFor(() =>
      expect(scroll.mock.contexts.some((el) => (el as Element).id === 'como-funciona')).toBe(true),
    )
  })

  it('rola de novo quando o hash muda dentro da própria landing', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute('/', { store: anonymousStore() })
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')

    await router.navigate('/#como-funciona')
    await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1))
    await router.navigate('/')
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    await user.click(within(nav).getByRole('link', { name: 'Como funciona' }))
    await waitFor(() => expect(scroll).toHaveBeenCalledTimes(2))
  })

  it('não rola quando não há hash nem quando o hash não existe na página', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderRoute('/#nao-existe', { store: anonymousStore() })
    await screen.findByText('Nubank')

    expect(scroll).not.toHaveBeenCalled()
  })

  it('rola sem animação para quem pede movimento reduzido', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderRoute('/#como-funciona', { store: anonymousStore() })

    await waitFor(() => expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' }))
  })

  it('rola com animação suave quando não há preferência', async () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderRoute('/#como-funciona', { store: anonymousStore() })

    await waitFor(() => expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' }))
  })
})
