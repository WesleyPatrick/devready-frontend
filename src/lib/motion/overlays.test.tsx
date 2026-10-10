import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { resetOverlaysForTests, useOverlayOpen, useRegisterOverlay } from './overlays'

function Overlay({ open }: { open: boolean }) {
  useRegisterOverlay(open)
  return null
}

function Harness() {
  const [first, setFirst] = useState(false)
  const [second, setSecond] = useState(false)
  const blocked = useOverlayOpen()
  return (
    <>
      <Overlay open={first} />
      <Overlay open={second} />
      <button onClick={() => setFirst(!first)}>primeiro</button>
      <button onClick={() => setSecond(!second)}>segundo</button>
      <p>{blocked ? 'aberto' : 'livre'}</p>
    </>
  )
}

it('fica aberto enquanto houver algum diálogo ou painel aberto', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  expect(screen.getByText('livre')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'primeiro' }))
  await user.click(screen.getByRole('button', { name: 'segundo' }))
  expect(screen.getByText('aberto')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'segundo' }))
  expect(screen.getByText('aberto')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'primeiro' }))
  expect(screen.getByText('livre')).toBeInTheDocument()
})

it('o contador não fica negativo: fechar depois de um reset não esconde o próximo diálogo', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByRole('button', { name: 'primeiro' }))
  act(() => resetOverlaysForTests())
  await user.click(screen.getByRole('button', { name: 'primeiro' }))
  expect(screen.getByText('livre')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'segundo' }))
  expect(screen.getByText('aberto')).toBeInTheDocument()
})
