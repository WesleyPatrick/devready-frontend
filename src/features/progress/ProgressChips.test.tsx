import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { AppStore } from '@/app/store'
import { questionsApi } from '@/features/questions/api'
import { COUNT_UP_MS } from '@/lib/motion/useCountUp'
import { useRegisterOverlay } from '@/lib/motion/overlays'
import { setReducedMotionForTests } from '@/lib/motion/reducedMotion'
import { optionOf } from '@/test/practice'
import { renderWithProviders, storeWithGoal } from '@/test/render'
import { ProgressChips } from './ProgressChips'

const SLUG = 'backend-junior-spring-constructor-injection'

function answer(store: AppStore) {
  return store.dispatch(
    questionsApi.endpoints.answerQuestion.initiate({
      slug: SLUG,
      optionId: optionOf(SLUG, 'correct').id,
    }),
  )
}

function Harness() {
  const [open, setOpen] = useState(false)
  useRegisterOverlay(open)
  return (
    <>
      <ProgressChips />
      <button onClick={() => setOpen(!open)}>diálogo</button>
    </>
  )
}

const icon = (title: string) => screen.getByTitle(title).querySelector('[data-slot="stat-icon"]')!
const value = (title: string) => screen.getByTitle(title).querySelector('[data-slot="stat-value"]')!

it('a sequência e o XP vêm da API, sem o aviso de dados de exemplo', async () => {
  renderWithProviders(<ProgressChips />, storeWithGoal())
  expect(await screen.findByTitle('Sequência de 6 dias')).toHaveTextContent('6')
  expect(screen.getByTitle('1.240 XP')).toHaveTextContent('1.240')
  expect(screen.queryByText(/dados de exemplo/)).not.toBeInTheDocument()
})

it('com diálogo aberto, segura o número e o raio; ao fechar, conta e anima', async () => {
  setReducedMotionForTests(false)
  const user = userEvent.setup()
  const store = storeWithGoal()
  renderWithProviders(<Harness />, store)
  await screen.findByTitle('1.240 XP')
  await user.click(screen.getByRole('button', { name: 'diálogo' }))

  await act(async () => {
    await answer(store)
  })
  const xpTitle = '1.270 XP'
  await screen.findByTitle(xpTitle)
  expect(screen.getByText('1.270 XP')).toHaveClass('sr-only')
  expect(value(xpTitle)).toHaveTextContent('1.240')
  expect(icon(xpTitle)).not.toHaveClass('animate-zap')
  expect(icon('Sequência de 7 dias')).not.toHaveClass('animate-blaze')

  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  try {
    await user.click(screen.getByRole('button', { name: 'diálogo' }))
    expect(icon(xpTitle)).toHaveClass('animate-zap')
    expect(icon('Sequência de 7 dias')).toHaveClass('animate-blaze')
    act(() => vi.advanceTimersByTime(COUNT_UP_MS * 2))
    await waitFor(() => expect(value(xpTitle)).toHaveTextContent('1.270'))
  } finally {
    vi.useRealTimers()
  }
})

it('com movimento reduzido, o número troca direto e nada anima', async () => {
  const store = storeWithGoal()
  renderWithProviders(<ProgressChips />, store)
  await screen.findByTitle('1.240 XP')
  await act(async () => {
    await answer(store)
  })
  const xpTitle = '1.270 XP'
  await screen.findByTitle(xpTitle)
  expect(value(xpTitle)).toHaveTextContent('1.270')
  expect(icon(xpTitle).querySelectorAll('[data-slot="spark"]')).toHaveLength(0)
})
