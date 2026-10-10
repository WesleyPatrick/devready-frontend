import { render, screen } from '@testing-library/react'
import { CompanyMonogram, CompanyStack } from './CompanyMonogram'

it('monograma mostra as iniciais e dá o nome para leitor de tela', () => {
  render(<CompanyMonogram company={{ slug: 'nubank', name: 'Nubank' }} />)
  expect(screen.getByText('Nu')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByText('Nubank')).toHaveClass('sr-only')
})

it('com withName, o nome fica visível', () => {
  render(<CompanyMonogram company={{ slug: 'google', name: 'Google' }} withName />)
  expect(screen.getByText('Google')).not.toHaveClass('sr-only')
})

it('pilha de empresas vira uma frase só', () => {
  render(
    <CompanyStack
      companies={[
        { slug: 'nubank', name: 'Nubank' },
        { slug: 'google', name: 'Google' },
      ]}
    />,
  )
  expect(screen.getByText('Pedido por Nubank e Google')).toHaveClass('sr-only')
  expect(screen.getByTitle('Pedido por Nubank e Google')).toBeInTheDocument()
})

it('sem empresas, a pilha não desenha nada nem dá frase para leitor de tela', () => {
  const { container } = render(<CompanyStack companies={[]} />)
  expect(container).toBeEmptyDOMElement()
})
