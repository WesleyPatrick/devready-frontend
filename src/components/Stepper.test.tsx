import { render, screen, within } from '@testing-library/react'
import { Flag, Layers } from 'lucide-react'
import { Stepper } from './Stepper'

describe('Stepper', () => {
  it('marca o passo atual e os concluídos', () => {
    render(<Stepper label="Passos" steps={['Empresas', 'Stack', 'Senioridade']} current={1} />)
    const list = screen.getByRole('list', { name: 'Passos' })
    expect(list).toHaveAttribute('role', 'list')
    const items = within(list).getAllByRole('listitem')
    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(items[0]).toHaveTextContent('Empresas')
    expect(items[0]).toHaveTextContent('concluído')
    expect(items[2]).not.toHaveAttribute('aria-current')
    expect(items[2]).not.toHaveTextContent('concluído')
    expect(items[1]).not.toHaveTextContent('concluído')
    expect(items[0]).not.toHaveAttribute('aria-current')
  })

  it('com ícones, o passo atual mostra o ícone e o concluído mostra o check', () => {
    const { container } = render(
      <Stepper
        label="Passos"
        steps={['Empresas', 'Stack', 'Senioridade']}
        current={1}
        icons={[Layers, Flag, Layers]}
      />,
    )
    const items = within(screen.getByRole('list', { name: 'Passos' })).getAllByRole('listitem')
    expect(items[0].querySelector('svg')).toHaveClass('lucide-check')
    expect(items[1].querySelector('svg')).toHaveClass('lucide-flag')
    expect(items[2].querySelector('svg')).toHaveClass('lucide-layers')
    expect(items[0]).toHaveTextContent('concluído')
    expect(container.querySelectorAll('li')).toHaveLength(3)
  })
})
