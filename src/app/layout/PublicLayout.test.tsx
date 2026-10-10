import { screen, within } from '@testing-library/react'
import { adminStore, renderRoute } from '@/test/render'
import { makeStore } from '@/app/store'
import { sessionEnded, sessionStarted } from '@/features/auth/slice'
import { candidate } from '@/test/fixtures'

describe('PublicLayout', () => {
  it('mostra a marca, Entrar, Criar conta e o tema para anônimo', async () => {
    const store = makeStore()
    store.dispatch(sessionEnded())
    renderRoute('/login', { store })

    const nav = within(await screen.findByRole('navigation', { name: 'Navegação principal' }))
    expect(nav.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(nav.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/register')
    expect(nav.getByRole('button', { name: 'Tema: escuro' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'DevReady' })).toHaveAttribute('href', '/')
  })

  it('o cabeçalho leva às seções Como funciona e Empresas da landing', async () => {
    renderRoute('/nao-existe')

    const nav = within(await screen.findByRole('navigation', { name: 'Navegação principal' }))
    expect(nav.getByRole('link', { name: 'Como funciona' })).toHaveAttribute(
      'href',
      '/#como-funciona',
    )
    expect(nav.getByRole('link', { name: 'Empresas' })).toHaveAttribute('href', '/#empresas')
  })

  it('sessão desconhecida: só os links de seção e o tema', async () => {
    renderRoute('/nao-existe')

    const nav = within(await screen.findByRole('navigation', { name: 'Navegação principal' }))
    expect(nav.getByRole('link', { name: 'Como funciona' })).toBeInTheDocument()
    expect(nav.getByRole('link', { name: 'Empresas' })).toBeInTheDocument()
    expect(nav.getByRole('button', { name: 'Tema: escuro' })).toBeInTheDocument()
    expect(nav.queryByRole('link', { name: 'Ir para a trilha' })).not.toBeInTheDocument()
    expect(nav.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()
    expect(nav.queryByRole('link', { name: 'Criar conta' })).not.toBeInTheDocument()
  })

  it('mostra Ir para a trilha para quem já entrou', async () => {
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
    renderRoute('/nao-existe', { store })

    const nav = within(await screen.findByRole('navigation', { name: 'Navegação principal' }))
    expect(nav.getByRole('link', { name: 'Ir para a trilha' })).toHaveAttribute('href', '/track')
    expect(nav.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()
    expect(nav.queryByRole('link', { name: 'Criar conta' })).not.toBeInTheDocument()
  })
  it('na página não encontrada, o admin tem o atalho para a gestão, não para a trilha', async () => {
    renderRoute('/nao-existe', { store: adminStore() })

    const nav = within(await screen.findByRole('navigation', { name: 'Navegação principal' }))
    expect(nav.getByRole('link', { name: 'Ir para os usuários' })).toHaveAttribute(
      'href',
      '/admin/users',
    )
    expect(nav.queryByRole('link', { name: 'Ir para a trilha' })).not.toBeInTheDocument()
  })
})
