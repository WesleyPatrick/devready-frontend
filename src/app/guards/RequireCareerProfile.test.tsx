import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Provider } from 'react-redux'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { makeStore } from '@/app/store'
import { paths } from '@/app/paths'
import { sessionStarted } from '@/features/auth/slice'
import { candidate, careerProfile } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { server } from '@/test/server'
import { RequireAuth } from './RequireAuth'
import { RequireCareerProfile } from './RequireCareerProfile'

function renderGuarded(path: string = paths.track) {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'access-1', user: candidate }))
  const router = createMemoryRouter(
    [
      {
        element: <RequireAuth />,
        children: [
          { path: paths.onboarding, element: <p>onboarding</p> },
          {
            element: <RequireCareerProfile />,
            children: [{ path: paths.track, element: <p>trilha</p> }],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  return { store, router }
}

describe('RequireCareerProfile', () => {
  it('mostra carregando enquanto busca o objetivo', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get('/api/v1/career/profile', async () => {
        await gate
        return HttpResponse.json(careerProfile)
      }),
    )
    renderGuarded()
    expect(await screen.findByRole('status')).toHaveTextContent('Carregando seu objetivo…')
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('status'))
    release()
    expect(await screen.findByText('trilha')).toBeInTheDocument()
  })

  it('manda para o onboarding quando o perfil não existe, guardando a origem', async () => {
    server.use(
      http.get('/api/v1/career/profile', () =>
        problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.'),
      ),
    )
    const { router } = renderGuarded('/track?aba=resumo')

    await waitFor(() => expect(router.state.location.pathname).toBe('/onboarding'))
    expect(router.state.location.state).toEqual({ from: '/track?aba=resumo' })
    expect(await screen.findByText('onboarding')).toBeInTheDocument()
  })

  it('mostra erro com nova tentativa quando o servidor falha', async () => {
    server.use(
      http.get('/api/v1/career/profile', () => problem(500, 'Erro', 'Falhou.'), { once: true }),
    )
    const user = userEvent.setup()
    renderGuarded()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar seu objetivo de carreira.',
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tema: escuro' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Conta de Ana' }))
    expect(await screen.findByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('trilha')).toBeInTheDocument()
  })

  it('na nova tentativa, o botão continua com o foco e não abre a área logada antes da resposta', async () => {
    server.use(
      http.get('/api/v1/career/profile', () => problem(500, 'Erro', 'Falhou.'), { once: true }),
    )
    const user = userEvent.setup()
    renderGuarded()
    const retry = await screen.findByRole('button', { name: 'Tentar de novo' })

    let release = () => {}
    const answered = new Promise<void>((resolve) => (release = resolve))
    let calls = 0
    server.use(
      http.get('/api/v1/career/profile', async () => {
        calls += 1
        await answered
        return HttpResponse.json(careerProfile)
      }),
    )
    retry.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => expect(retry).toHaveAttribute('aria-disabled', 'true'))
    expect(retry).toBeInTheDocument()
    expect(retry).toHaveFocus()
    expect(screen.queryByText('trilha')).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(calls).toBe(1)
    release()
    expect(await screen.findByText('trilha')).toBeInTheDocument()
  })
})
