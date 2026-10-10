import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { CodeEditor } from './CodeEditor'

function Host({ onRun = () => {} }: { onRun?: () => void }) {
  const [code, setCode] = useState('class Solution {}')
  return (
    <>
      <CodeEditor
        value={code}
        language="JAVA"
        modelPath="two-sum/JAVA"
        label="Código"
        onChange={setCode}
        onRun={onRun}
      />
      <p aria-label="Valor">{code}</p>
    </>
  )
}

describe('CodeEditor', () => {
  it('mostra a espera enquanto o editor chega e depois o código', async () => {
    render(<Host />)

    expect(screen.getByRole('status')).toHaveTextContent('Carregando o editor…')
    expect(await screen.findByRole('textbox', { name: 'Código' })).toHaveValue('class Solution {}')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('o que se digita volta pelo onChange', async () => {
    const user = userEvent.setup()
    render(<Host />)
    const editor = await screen.findByRole('textbox', { name: 'Código' })

    await user.clear(editor)
    await user.type(editor, 'x = 1')

    expect(screen.getByLabelText('Valor')).toHaveTextContent('x = 1')
  })

  it('Ctrl+Enter e Cmd+Enter rodam, sem quebrar linha', async () => {
    const onRun = vi.fn()
    const user = userEvent.setup()
    render(<Host onRun={onRun} />)
    const editor = await screen.findByRole('textbox', { name: 'Código' })

    await user.click(editor)
    await user.keyboard('{Control>}{Enter}{/Control}')
    await user.keyboard('{Meta>}{Enter}{/Meta}')

    expect(onRun).toHaveBeenCalledTimes(2)
    expect(editor).toHaveValue('class Solution {}')
  })
})
