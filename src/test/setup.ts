import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { resetOverlaysForTests } from '@/lib/motion/overlays'
import { setReducedMotionForTests } from '@/lib/motion/reducedMotion'
import { setSearchDelayForTests } from '@/features/admin/searchDelay'
import { setSubmissionPollForTests } from '@/features/challenge/polling'
import { setCountdownTickForTests } from '@/features/session/useCountdown'
import { toast } from 'sonner'
import { resetAdminUsers } from './admin'
import { resetAchievements } from './achievements'
import { resetChallenges } from './challenge'
import { resetPractice } from './practice'
import { resetSessions } from './session'
import { server } from './server'

Element.prototype.hasPointerCapture ??= () => false
Element.prototype.scrollIntoView ??= () => {}
window.AnimationEvent ??= class AnimationEvent extends Event {} as typeof window.AnimationEvent

vi.mock('@/features/challenge/MonacoEditor', () => import('./TextareaEditor'))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())

afterEach(() => {
  resetPractice()
  resetChallenges()
  resetSessions()
  resetAchievements()
  resetAdminUsers()
  toast.dismiss()
})

beforeEach(() => {
  setSubmissionPollForTests(20)
  setCountdownTickForTests(20)
  setSearchDelayForTests(20)
})

beforeEach(() => setReducedMotionForTests(true))
afterEach(() => resetOverlaysForTests())
afterAll(() => server.close())
