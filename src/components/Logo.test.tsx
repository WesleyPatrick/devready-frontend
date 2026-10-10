import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

it('foguinho, "dev" e "ready" em laranja, com o nome para leitor de tela', () => {
  const { container } = render(<Logo />)
  expect(container.querySelector('svg.lucide-flame')).toHaveClass('text-brand')
  expect(screen.getByText('DevReady')).toHaveClass('sr-only')
  const wordmark = container.querySelector('[data-slot="wordmark"]')!
  expect(wordmark).toHaveAttribute('aria-hidden', 'true')
  expect(wordmark).toHaveTextContent('devready')
  expect(wordmark.querySelector('.text-brand')).toHaveTextContent('ready')
})
