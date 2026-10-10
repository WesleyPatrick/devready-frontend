import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListFilter } from 'lucide-react'
import { FilterMenu } from './FilterMenu'

it('mostra a escolha no botão e avisa a nova escolha', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(
    <FilterMenu
      label="Dificuldade"
      icon={ListFilter}
      value="MEDIUM"
      onChange={onChange}
      options={[
        { value: 'all', label: 'Todas' },
        { value: 'MEDIUM', label: 'Médio' },
        { value: 'HARD', label: 'Difícil' },
      ]}
    />,
  )
  await user.click(screen.getByRole('button', { name: 'Dificuldade: Médio' }))
  expect(screen.getByRole('menuitemradio', { name: 'Médio' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await user.click(screen.getByRole('menuitemradio', { name: 'Difícil' }))
  expect(onChange).toHaveBeenCalledWith('HARD')
})

it('com "todas", o botão leva só o rótulo', () => {
  render(
    <FilterMenu
      label="Empresa"
      icon={ListFilter}
      value="all"
      onChange={() => {}}
      options={[{ value: 'all', label: 'Todas' }]}
    />,
  )
  expect(screen.getByRole('button', { name: 'Empresa' })).toBeInTheDocument()
})
