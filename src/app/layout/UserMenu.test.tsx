import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { candidate } from '@/test/fixtures'
import { adminStore, renderRoute, renderWithProviders } from '@/test/render'
import { FocusedLayout } from './FocusedLayout'

async function openAccountMenu(name: string) {
  const user = userEvent.setup()
  const header = await screen.findByRole('banner')
  await user.click(await within(header).findByRole('button', { name }))
  await screen.findAllByRole('menuitem')
  return user
}

const menuItems = () => screen.getAllByRole('menuitem').map((item) => item.textContent)

describe('UserMenu', () => {
  it('o admin vê Usuários, Perfil e Sair, e o item leva à gestão', async () => {
    renderRoute('/admin/users', { store: adminStore() })
    await screen.findByRole('navigation', { name: 'Navegação principal' })
    await openAccountMenu('Conta de Administrador')

    expect(menuItems()).toEqual(['Usuários', 'Perfil', 'Sair'])
    expect(screen.getByRole('menuitem', { name: 'Usuários' })).toHaveAttribute(
      'href',
      '/admin/users',
    )
    expect(screen.getByRole('menuitem', { name: 'Perfil' })).toHaveAttribute('href', '/profile')
  })

  it('quem não é admin não vê Usuários', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
    renderRoute('/track', { store })
    await screen.findByRole('navigation', { name: 'Navegação principal' })
    await openAccountMenu('Conta de Ana')

    expect(menuItems()).toEqual(['Perfil', 'Sair'])
  })

  it('na moldura focada, o menu fica só com Sair, mesmo para o admin', async () => {
    const router = createMemoryRouter(
      [{ element: <FocusedLayout />, children: [{ path: '/', element: <p>conteúdo</p> }] }],
      { initialEntries: ['/'] },
    )
    renderWithProviders(<RouterProvider router={router} />, adminStore())
    await openAccountMenu('Conta de Administrador')

    expect(menuItems()).toEqual(['Sair'])
  })
})
