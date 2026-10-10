import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { adminStore, renderRoute } from '@/test/render'

vi.mock('@/features/admin/AdminUsersPage', () => ({
  default: () => {
    throw new Error('falha inesperada')
  },
}))

const reload = vi.hoisted(() => vi.fn())
vi.mock('@/lib/reloadPage', () => ({ reloadPage: reload }))

describe('erro numa rota', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('mostra a página de erro em português, com recarregar e voltar ao início', async () => {
    renderRoute('/admin/users', { store: adminStore() })

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Algo deu errado nesta página' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Unexpected Application Error/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toHaveAttribute('href', '/')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Recarregar a página' }))
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
