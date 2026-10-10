import { act, renderHook } from '@testing-library/react'
import { useDebounced } from './useDebounced'

describe('useDebounced', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('entrega o valor só depois da espera, e cada mudança recomeça a espera', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounced(value, 300), {
      initialProps: { value: '' },
    })

    rerender({ value: 'e' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'el' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('el')
  })
})
