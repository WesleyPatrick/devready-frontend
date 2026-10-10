import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { problem } from '@/test/handlers'
import { renderRoute, renderWithProviders, anonymousStore } from '@/test/render'
import { SocialButtons } from './SocialButtons'

function providers(list: string[]) {
  return http.get('/api/v1/auth/providers', () => HttpResponse.json({ providers: list }))
}

describe('SocialButtons', () => {
  it('mostra os dois provedores quando a API tem os dois configurados', async () => {
    renderWithProviders(<SocialButtons />)
    expect(await screen.findByRole('link', { name: 'Entrar com Google' })).toHaveAttribute(
      'href',
      '/oauth2/authorization/google',
    )
    expect(screen.getByRole('link', { name: 'Entrar com GitHub' })).toHaveAttribute(
      'href',
      '/oauth2/authorization/github',
    )
    expect(screen.getByText('ou')).toBeInTheDocument()
  })

  it('mostra só o provedor configurado', async () => {
    server.use(providers(['GITHUB']))
    renderWithProviders(<SocialButtons />)
    expect(await screen.findByRole('link', { name: 'Entrar com GitHub' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Entrar com Google' })).not.toBeInTheDocument()
  })

  it('sem provedor configurado, a seção some, sem o separador', async () => {
    let asked = false
    server.use(
      http.get('/api/v1/auth/providers', () => {
        asked = true
        return HttpResponse.json({ providers: [] })
      }),
    )
    const { container } = renderWithProviders(<SocialButtons />)
    await waitFor(() => expect(asked).toBe(true))
    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(screen.queryByText('ou')).not.toBeInTheDocument()
  })

  it('se a consulta falha, não mostra botão que levaria a um provedor sem credencial', async () => {
    let asked = false
    server.use(
      http.get('/api/v1/auth/providers', () => {
        asked = true
        return problem(500, 'Erro interno', 'Falhou.')
      }),
    )
    const { container } = renderWithProviders(<SocialButtons />)
    await waitFor(() => expect(asked).toBe(true))
    expect(container).toBeEmptyDOMElement()
  })

  it('o login e o cadastro seguem a lista da API', async () => {
    server.use(providers(['GOOGLE']))
    renderRoute('/login', { store: anonymousStore() })
    expect(await screen.findByRole('link', { name: 'Entrar com Google' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Entrar com GitHub' })).not.toBeInTheDocument()
  })
})
