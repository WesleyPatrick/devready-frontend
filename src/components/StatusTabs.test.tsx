import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Layers, CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { StatusTabs } from './StatusTabs'

function Harness() {
  const [value, setValue] = useState<'all' | 'done'>('all')
  return (
    <StatusTabs
      label="Situação"
      value={value}
      onValueChange={setValue}
      items={[
        { value: 'all', label: 'Todas', icon: Layers },
        { value: 'done', label: 'Concluídas', icon: CircleCheck },
      ]}
    >
      <p>conteúdo</p>
    </StatusTabs>
  )
}

describe('StatusTabs', () => {
  it('um destaque só, decorativo, que acompanha a aba ativa', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const indicator = document.querySelector('[data-slot="tab-indicator"]')!
    expect(indicator).toHaveAttribute('aria-hidden', 'true')
    await user.click(screen.getByRole('tab', { name: /Concluídas/ }))
    expect(screen.getByRole('tab', { name: /Concluídas/ })).toHaveAttribute('data-state', 'active')
    expect(indicator).toHaveAttribute('data-for', 'done')
  })

  it('com movimento reduzido, o destaque não desliza: o desligamento vale também depois da primeira posição', () => {
    render(<Harness />)
    const indicator = document.querySelector('[data-slot="tab-indicator"]')!
    expect(indicator.className).toContain('motion-reduce:data-[ready=true]:transition-none')
  })
})
