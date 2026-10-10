import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/server'
import { renderWithProviders } from '@/test/render'
import { ApiStatus } from './ApiStatus'

describe('ApiStatus', () => {
  it('mostra "API online" quando o health responde UP', async () => {
    renderWithProviders(<ApiStatus />)
    expect(await screen.findByText('API online')).toBeInTheDocument()
  })

  it('mostra "API indisponível" quando o health falha', async () => {
    server.use(
      http.get('/actuator/health', () => HttpResponse.json({ status: 'DOWN' }, { status: 503 })),
    )
    renderWithProviders(<ApiStatus />)
    expect(await screen.findByText('API indisponível')).toBeInTheDocument()
  })
})
