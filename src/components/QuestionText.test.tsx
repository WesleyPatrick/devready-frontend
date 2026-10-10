import { render, screen } from '@testing-library/react'
import { QuestionText } from './QuestionText'

it('código em linha vira <code> e bloco cercado vira <pre>', () => {
  const { container } = render(
    <QuestionText
      text={
        'Considere as tabelas `pedidos` e `clientes`.\n```js\nconsole.log(1)\n```\nQual a saída?'
      }
    />,
  )
  expect(screen.getByText('pedidos').tagName).toBe('CODE')
  expect(container.querySelector('pre code')).toHaveTextContent('console.log(1)')
  expect(screen.getByText('Qual a saída?')).toBeInTheDocument()
})
