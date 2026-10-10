import { render, screen, within } from '@testing-library/react'
import { DataTable } from './DataTable'

const rows = [
  { id: 'a', name: 'SQL' },
  { id: 'b', name: 'APIs' },
]

it('tabela semântica com legenda, cabeçalhos e linhas', () => {
  render(
    <DataTable
      caption="Competências"
      rows={rows}
      rowKey={(row) => row.id}
      columns={[{ key: 'name', header: 'Nome', cell: (row) => row.name }]}
    />,
  )
  const table = screen.getByRole('table', { name: 'Competências' })
  expect(within(table).getByRole('columnheader', { name: 'Nome' })).toHaveAttribute('scope', 'col')
  expect(within(table).getAllByRole('row')).toHaveLength(3)
})

it('sem linhas, mostra a mensagem de vazio ocupando a largura toda', () => {
  render(
    <DataTable
      caption="Competências"
      rows={[] as typeof rows}
      rowKey={(row) => row.id}
      empty="Nada aqui."
      columns={[
        { key: 'name', header: 'Nome', cell: (row) => row.name },
        { key: 'id', header: 'Id', cell: (row) => row.id },
      ]}
    />,
  )
  expect(screen.getByRole('cell', { name: 'Nada aqui.' })).toHaveAttribute('colspan', '2')
})

it('com animateRows, as linhas entram em cascata', () => {
  render(
    <DataTable
      caption="Tabela"
      columns={[{ key: 'n', header: 'N', cell: (row: { n: string }) => row.n }]}
      rows={[{ n: 'a' }, { n: 'b' }, { n: 'c' }]}
      rowKey={(row) => row.n}
      animateRows
    />,
  )
  const rows = screen.getAllByRole('row').slice(1)
  expect(rows[0]).toHaveClass('animate-rise')
  expect(rows[2]).toHaveStyle({ animationDelay: '140ms' })
})

it('o contêiner que rola é posicionado: um sr-only absoluto lá dentro não alarga a página', () => {
  render(
    <DataTable
      caption="Competências"
      rows={rows}
      rowKey={(row) => row.id}
      columns={[
        { key: 'name', header: <span className="sr-only">Nome</span>, cell: (row) => row.name },
      ]}
    />,
  )
  expect(screen.getByRole('table', { name: 'Competências' }).parentElement).toHaveClass(
    'relative',
    'overflow-x-auto',
  )
})
