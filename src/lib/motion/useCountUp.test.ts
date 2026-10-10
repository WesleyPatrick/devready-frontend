import { act, renderHook } from '@testing-library/react'
import { setReducedMotionForTests } from './reducedMotion'
import { COUNT_UP_MS, useCountUp } from './useCountUp'

type Props = { value: number | undefined; paused?: boolean }

function setup(initial: Props) {
  return renderHook(({ value, paused }: Props) => useCountUp(value, { paused }), {
    initialProps: initial,
  })
}

describe('com movimento', () => {
  beforeEach(() => {
    setReducedMotionForTests(false)
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('o primeiro valor aparece direto', () => {
    const { result, rerender } = setup({ value: undefined })
    expect(result.current).toBeUndefined()
    rerender({ value: 1240 })
    expect(result.current).toBe(1240)
  })

  it('conta do valor anterior até o novo', () => {
    const { result, rerender } = setup({ value: 1240 })
    rerender({ value: 1270 })
    expect(result.current).toBe(1240)
    act(() => vi.advanceTimersByTime(COUNT_UP_MS / 2))
    expect(result.current).toBeGreaterThan(1240)
    expect(result.current).toBeLessThan(1270)
    act(() => vi.advanceTimersByTime(COUNT_UP_MS))
    expect(result.current).toBe(1270)
  })

  it('um quadro com hora anterior ao início não leva o número para baixo do anterior', () => {
    const frames: FrameRequestCallback[] = []
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback)
      return frames.length
    })
    const { result, rerender } = setup({ value: 1240 })
    rerender({ value: 1270 })
    act(() => frames.shift()?.(performance.now() - 16))
    expect(result.current).toBe(1240)
  })

  it('queda troca direto', () => {
    const { result, rerender } = setup({ value: 3 })
    rerender({ value: 0 })
    expect(result.current).toBe(0)
  })

  it('com paused, segura o número antigo e conta depois de soltar', () => {
    const { result, rerender } = setup({ value: 6 })
    rerender({ value: 7, paused: true })
    act(() => vi.advanceTimersByTime(COUNT_UP_MS * 2))
    expect(result.current).toBe(6)
    rerender({ value: 7, paused: false })
    act(() => vi.advanceTimersByTime(COUNT_UP_MS * 2))
    expect(result.current).toBe(7)
  })
})

it('com movimento reduzido, troca direto', () => {
  const { result, rerender } = setup({ value: 1240 })
  rerender({ value: 1270 })
  expect(result.current).toBe(1270)
})
