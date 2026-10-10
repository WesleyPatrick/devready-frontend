import { render, screen } from '@testing-library/react'
import { Flame } from 'lucide-react'
import { CompetencyIcon } from './CompetencyIcon'
import { DifficultyBar } from './DifficultyBar'
import { DifficultyLabel } from './DifficultyLabel'
import { FrequencyBar } from './FrequencyBar'
import { StatChip } from './StatChip'
import { StatusIcon } from './StatusIcon'

describe('indicadores', () => {
  it('dificuldade em texto e na cor do nível', () => {
    render(<DifficultyLabel difficulty="MEDIUM" />)
    expect(screen.getByText('Médio')).toHaveClass('text-medium')
  })

  it('barra de dificuldade diz quantas foram concluídas', () => {
    const { container } = render(<DifficultyBar difficulty="EASY" done={3} total={4} />)
    expect(screen.getByText('3 de 4 concluídas')).toBeInTheDocument()
    expect(container.querySelector('.bg-easy')).toHaveStyle({ width: '75%' })
  })

  it('frequência em fração das vagas da trilha, em mono, e por extenso', () => {
    const { container } = render(<FrequencyBar jobs={423} total={604} />)
    expect(screen.getByText('Pedido em 423 de 604 vagas')).toHaveClass('sr-only')
    expect(screen.getByText('423/604')).toHaveClass('font-mono')
    expect(container.querySelector('.bg-brand')).toHaveStyle({ width: '70%' })
  })

  it.each([
    ['DONE', 'Concluída', 'text-easy', 'lucide-circle-check'],
    ['IN_PROGRESS', 'Em andamento', 'text-medium', 'lucide-contrast'],
    ['NOT_STARTED', 'Não iniciada', 'text-muted-foreground', 'lucide-circle-dashed'],
    ['LOCKED', 'Bloqueada', 'text-muted-foreground', 'lucide-lock'],
    ['SOLVED', 'Resolvida', 'text-easy', 'lucide-circle-check'],
    ['ATTEMPTED', 'Tentada', 'text-medium', 'lucide-contrast'],
  ] as const)(
    'status %s tem texto para leitor de tela, ícone e cor',
    (status, text, tone, icon) => {
      const { container } = render(<StatusIcon status={status} />)
      expect(screen.getByText(text)).toHaveClass('sr-only')
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass(tone, icon)
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    },
  )

  it('ícone por categoria, com um genérico para categoria desconhecida', () => {
    const { container, rerender } = render(<CompetencyIcon category="dados" />)
    expect(container.querySelector('svg')).toHaveAttribute('data-category', 'dados')
    expect(container.querySelector('svg')?.getAttribute('class')).toMatch(/lucide-database/)
    rerender(<CompetencyIcon category="fundamento" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toMatch(/lucide-layers/)
    rerender(<CompetencyIcon category="comportamental" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toMatch(/lucide-users/)
    rerender(<CompetencyIcon category="algo-novo" />)
    expect(container.querySelector('svg')?.getAttribute('class')).toMatch(/lucide-circle-dot/)
  })

  it('chip de indicador com o rótulo no title e para leitor de tela', () => {
    render(<StatChip icon={Flame} value="6" label="Sequência de 6 dias" tone="brand" />)
    expect(screen.getByTitle('Sequência de 6 dias')).toHaveTextContent('6')
    expect(screen.getByText('Sequência de 6 dias')).toHaveClass('sr-only')
  })
})
