import { useRef, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

function Harness({ onConfirm = () => {} }: { onConfirm?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Restaurar
      </button>
      <button type="button">Outro</button>
      <ConfirmDialog
        open={open}
        title="Restaurar o código inicial?"
        body="O rascunho é descartado."
        action="Restaurar"
        onConfirm={() => {
          onConfirm()
          setOpen(false)
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

function MenuHarness() {
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const back = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button type="button" ref={back}>
        Ações
      </button>
      <button type="button" onClick={() => setMenu(true)}>
        Abrir menu
      </button>
      {menu && (
        <button
          type="button"
          onClick={() => {
            setMenu(false)
            setOpen(true)
          }}
        >
          Desativar
        </button>
      )}
      <ConfirmDialog
        open={open}
        title="Desativar?"
        body="A conta sai."
        action="Confirmar"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        returnFocusTo={() => back.current}
      />
    </>
  )
}

describe('ConfirmDialog', () => {
  it('Esc devolve o foco ao botão que abriu', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Restaurar' })
    await user.click(trigger)
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('Cancelar devolve o foco ao botão que abriu', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Restaurar' })
    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('aberto pelo teclado, o foco também volta', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.tab()
    const trigger = screen.getByRole('button', { name: 'Restaurar' })
    expect(trigger).toHaveFocus()
    await user.keyboard('{Enter}')
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    expect(trigger).toHaveFocus()
  })

  it('confirmar fecha sem prender o foco no diálogo', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)
    const trigger = screen.getByRole('button', { name: 'Restaurar' })
    await user.click(trigger)
    const dialog = await screen.findByRole('dialog')
    await user.click(await screen.findByRole('button', { name: 'Restaurar', hidden: false }))

    expect(onConfirm).toHaveBeenCalled()
    expect(dialog).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('quem abriu sumiu (um item de menu): o foco vai para o returnFocusTo', async () => {
    const user = userEvent.setup()
    render(<MenuHarness />)
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }))
    await user.click(screen.getByRole('button', { name: 'Desativar' }))
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ações' })).toHaveFocus()
  })
})
