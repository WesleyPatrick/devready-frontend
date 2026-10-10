import { render, screen } from '@testing-library/react'
import { Map } from 'lucide-react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('mostra título, texto e ação', () => {
    const { container } = render(
      <EmptyState icon={Map} title="Nada por aqui" action={<button type="button">Voltar</button>}>
        Ainda não há itens.
      </EmptyState>,
    )
    expect(screen.getByRole('heading', { name: 'Nada por aqui' })).toBeInTheDocument()
    expect(screen.getByText('Ainda não há itens.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument()
    expect(container.querySelector('.rounded-full')).toBeNull()
  })

  it('usa h2 por padrão e aceita h1', () => {
    const { rerender } = render(<EmptyState icon={Map} title="Nada por aqui" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Nada por aqui' })).toBeInTheDocument()

    rerender(<EmptyState icon={Map} title="Nada por aqui" headingLevel="h1" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Nada por aqui' })).toBeInTheDocument()
  })
})
