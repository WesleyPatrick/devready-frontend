import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { anonymousStore, renderRoute } from '@/test/render'
import { appTexts } from '@/app/texts'
import { makeStore } from '@/app/store'
import { sessionEnded, sessionStarted } from '@/features/auth/slice'
import { careerTexts } from '@/features/career/texts'
import { landingTexts } from '@/features/landing/texts'
import { candidate, careerProfile } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { server } from '@/test/server'

function signedIn() {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
  return store
}

describe('rotas', () => {
  it('anônimo na raiz vê a landing', async () => {
    const store = makeStore()
    store.dispatch(sessionEnded())
    const { router } = renderRoute('/', { store })

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: new RegExp(`^${landingTexts.hero.title}`),
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  it('quem já entrou vai da raiz para a trilha', async () => {
    const { router } = renderRoute('/', { store: signedIn() })

    await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Sua trilha' })).toBeInTheDocument()
  })

  it('quem entrou sem objetivo vai da trilha para o onboarding, sem a barra do topo', async () => {
    server.use(
      http.get('/api/v1/career/profile', () =>
        problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.'),
      ),
    )
    const { router } = renderRoute('/track', { store: signedIn() })

    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'))
    expect(
      await screen.findByRole('heading', { name: careerTexts.onboarding.companies.title }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tema: escuro' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('logado e com objetivo, /questions mostra o título Questões', async () => {
    renderRoute('/questions', { store: signedIn() })

    expect(await screen.findByRole('heading', { level: 1, name: 'Questões' })).toBeInTheDocument()
  })

  it.each([
    ['/track', 'Sua trilha'],
    ['/questions', 'Questões'],
    ['/profile', 'Perfil'],
    ['/simulations/new', 'Nova simulação'],
  ])('o título de %s tem o mesmo tamanho das outras páginas da área logada', async (path, name) => {
    renderRoute(path, { store: signedIn() })
    const title = await screen.findByRole('heading', { level: 1, name })
    expect(title.className).toBe('text-2xl font-semibold tracking-tight')
  })

  it('mostra a página de não encontrado em rota desconhecida', async () => {
    renderRoute('/nao-existe', { store: anonymousStore() })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: appTexts.notFound.back })).toHaveAttribute('href', '/')
  })

  describe('conta nova, sem objetivo', () => {
    function profileStartsMissing() {
      let saved = false
      server.use(
        http.get('/api/v1/career/profile', () =>
          saved
            ? HttpResponse.json(careerProfile)
            : problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.'),
        ),
        http.put('/api/v1/career/profile', () => {
          saved = true
          return HttpResponse.json(careerProfile)
        }),
      )
    }

    async function chooseAndFinish(user: ReturnType<typeof userEvent.setup>) {
      await user.click(await screen.findByRole('checkbox', { name: 'Nubank' }))
      await user.click(screen.getByRole('button', { name: 'Continuar' }))
      await user.click(await screen.findByRole('radio', { name: 'Java e Spring' }))
      await user.click(screen.getByRole('button', { name: 'Continuar' }))
      await user.click(await screen.findByRole('radio', { name: /Júnior/ }))
      await user.click(screen.getByRole('button', { name: 'Concluir' }))
    }

    it('cadastro leva ao onboarding e, concluído, à trilha', async () => {
      profileStartsMissing()
      const user = userEvent.setup()
      const { router } = renderRoute('/register', { store: anonymousStore() })

      await user.type(await screen.findByLabelText('Nome'), 'Ana')
      await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
      await user.type(screen.getByLabelText('Senha'), 'senha-forte')
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'))
      expect(
        await screen.findByRole('heading', { name: careerTexts.onboarding.companies.title }),
      ).toBeInTheDocument()

      await chooseAndFinish(user)

      await waitFor(() => expect(router.state.location.pathname).toBe('/track'))
      const track = await screen.findByRole('heading', { level: 1, name: 'Sua trilha' })
      expect(track).toBeInTheDocument()
      await screen.findByRole('table', { name: 'Competências da trilha' })
      expect(within(screen.getByRole('main')).queryByRole('status')).not.toBeInTheDocument()
    })

    it('login social leva ao onboarding quando ainda não há objetivo', async () => {
      profileStartsMissing()
      const { router } = renderRoute('/auth/callback?code=abc', { store: anonymousStore() })

      await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'))
      expect(
        await screen.findByRole('heading', { name: careerTexts.onboarding.companies.title }),
      ).toBeInTheDocument()
      expect(router.state.location.state).toEqual({ from: '/track' })
    })
  })
})
