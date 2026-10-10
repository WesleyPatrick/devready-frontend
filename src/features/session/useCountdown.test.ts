import { renderHook } from '@testing-library/react'
import { formatClock, useCountdown } from './useCountdown'

it('mostra minutos e segundos, com horas só acima de uma hora, arredondando para cima', () => {
  expect(formatClock(45 * 60_000)).toBe('45:00')
  expect(formatClock(4 * 60_000 + 1)).toBe('04:01')
  expect(formatClock(999)).toBe('00:01')
  expect(formatClock(0)).toBe('00:00')
  expect(formatClock(61 * 60_000)).toBe('1:01:00')
})

it('no zero, avisa uma vez só, mesmo que quem chama troque a função a cada render', async () => {
  const expired = vi.fn()
  const past = new Date(Date.now() - 1000).toISOString()
  const { result, rerender } = renderHook(() => useCountdown(past, () => expired()))

  expect(result.current).toBe(0)
  await new Promise((resolve) => setTimeout(resolve, 100))
  rerender()
  rerender()

  expect(expired).toHaveBeenCalledTimes(1)
})
