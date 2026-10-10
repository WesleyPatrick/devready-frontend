import { StrictMode } from 'react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { toast } from 'sonner'
import userEvent from '@testing-library/user-event'
import { makeStore, type AppStore } from '@/app/store'
import { Toaster } from '@/components/Toaster'
import { sessionStarted } from '@/features/auth/slice'
import { burstFrom } from '@/lib/motion/celebrate'
import { setReducedMotionForTests } from '@/lib/motion/reducedMotion'
import { candidate } from '@/test/fixtures'
import { optionOf } from '@/test/practice'
import { renderRoute, renderWithProviders, storeWithGoal } from '@/test/render'
import { AchievementToasts } from './AchievementToasts'
import { progressApi } from './api'

vi.mock('@/lib/motion/celebrate', () => ({
  cannons: vi.fn(() => Promise.resolve()),
  burstFrom: vi.fn(() => Promise.resolve()),
}))

afterEach(() => {
  toast.dismiss()
})

const DAILY = 'backend-junior-java-equals-hashcode'

function unlockWeek(store: AppStore) {
  store.dispatch(
    progressApi.util.updateQueryData('getAchievements', undefined, (draft) => {
      draft.find((item) => item.slug === 'sequencia-7')!.unlockedAt = new Date().toISOString()
    }),
  )
}

async function answerDailyAndUnlock() {
  const store = makeStore()
  store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
  renderRoute('/track', { store })
  const user = userEvent.setup()
  await screen.findByRole('heading', { level: 1, name: 'Sua trilha' })
  const panel = within(await screen.findByRole('region', { name: 'Seu progresso' }))
  await user.click(await panel.findByRole('button', { name: 'Responder · +40 XP' }))
  await user.click(await screen.findByRole('radio', { name: optionOf(DAILY, 'correct').label }))
  await user.click(screen.getByRole('button', { name: 'Responder' }))
  await screen.findByText('Acertou! +40 XP')
  expect(
    await screen.findByText('Uma semana seguida, desbloqueada: Praticou sete dias seguidos.'),
  ).toBeInTheDocument()
  expect(screen.queryByText('Conquista desbloqueada')).toBeNull()
  return user
}

it('o aviso de conquista só aparece depois que o diálogo fecha', async () => {
  const user = await answerDailyAndUnlock()
  await user.click(screen.getAllByRole('button', { name: 'Fechar' })[0])
  const region = screen.getByRole('region', { name: /Avisos/ })
  expect(await within(region).findByText('Conquista desbloqueada')).toBeInTheDocument()
  expect(within(region).getByText('Uma semana seguida')).toBeInTheDocument()
})

it('com movimento, o aviso vem 600 ms depois de o diálogo fechar', async () => {
  setReducedMotionForTests(false)
  await answerDailyAndUnlock()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    fireEvent.click(screen.getAllByRole('button', { name: 'Fechar' })[0])
    const region = screen.getByRole('region', { name: /Avisos/ })
    await act(() => vi.advanceTimersByTimeAsync(550))
    expect(within(region).queryByText('Conquista desbloqueada')).toBeNull()
    await act(() => vi.advanceTimersByTimeAsync(100))
    expect(within(region).getByText('Conquista desbloqueada')).toBeInTheDocument()
  } finally {
    vi.useRealTimers()
  }
})

it('no StrictMode, o confete do aviso sai uma vez só', async () => {
  vi.mocked(burstFrom).mockClear()
  const store = storeWithGoal()
  renderWithProviders(
    <StrictMode>
      <AchievementToasts />
      <Toaster />
    </StrictMode>,
    store,
  )
  await waitFor(() =>
    expect(progressApi.endpoints.getAchievements.select()(store.getState()).data).toBeDefined(),
  )
  act(() => unlockWeek(store))

  expect(await screen.findByText('Conquista desbloqueada')).toBeInTheDocument()
  expect(burstFrom).toHaveBeenCalledTimes(1)
})
