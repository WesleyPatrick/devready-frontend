import { render, screen } from '@testing-library/react'
import { Loading, PageSkeleton, Skeleton } from './Skeleton'

it('o esqueleto é decorativo e brilha só com movimento', () => {
  const { container } = render(<Skeleton className="h-4" />)
  const block = container.firstElementChild!
  expect(block).toHaveAttribute('aria-hidden', 'true')
  expect(block.className).toMatch(/after:animate-shimmer/)
  expect(block.className).toMatch(/motion-reduce:after:hidden/)
})

it('a região de carregamento fala o texto para leitor de tela', () => {
  render(
    <Loading label="Carregando trilha…">
      <Skeleton className="h-4" />
    </Loading>,
  )
  const status = screen.getByRole('status')
  expect(status).toHaveTextContent('Carregando trilha…')
  expect(screen.getByText('Carregando trilha…')).toHaveClass('sr-only')
})

it('a página de espera traz o texto e os blocos', () => {
  const { container } = render(<PageSkeleton label="Carregando…" />)
  expect(screen.getByRole('status')).toHaveTextContent('Carregando…')
  expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(1)
})
