import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { RouteErrorPage } from './RouteErrorPage'

function Throws({ error }: { error: unknown }): never {
  throw error
}

function renderError(error: unknown) {
  const router = createMemoryRouter([
    { path: '/', element: <Throws error={error} />, errorElement: <RouteErrorPage /> },
  ])
  return render(<RouterProvider router={router} />)
}

describe('RouteErrorPage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it.each([
    'Failed to fetch dynamically imported module: https://devready.example/assets/SessionPage-abc123.js',
    'error loading dynamically imported module: https://devready.example/assets/SessionPage-abc123.js',
    'Importing a module script failed.',
    'Unable to preload CSS for /assets/SessionPage-abc123.css',
  ])(
    'pedaço do pacote que não carrega (%s): diz que houve atualização e sugere recarregar',
    (message) => {
      renderError(new TypeError(message))
      expect(
        screen.getByRole('heading', { level: 1, name: 'O DevReady foi atualizado' }),
      ).toBeInTheDocument()
      expect(screen.getByText(/versão anterior/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Recarregar a página' })).toBeInTheDocument()
    },
  )

  it('outro erro: mensagem geral, sem falar em atualização', () => {
    renderError(new Error('Cannot read properties of undefined'))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Algo deu errado nesta página' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/atualizado/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Cannot read properties/)).not.toBeInTheDocument()
  })
})
