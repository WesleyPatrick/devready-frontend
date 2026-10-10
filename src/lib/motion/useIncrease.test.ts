import { renderHook } from '@testing-library/react'
import { useIncrease } from './useIncrease'

type Props = { value: number | undefined; paused?: boolean }

function setup(initial: Props) {
  return renderHook(({ value, paused }: Props) => useIncrease(value, { paused }), {
    initialProps: initial,
  })
}

it('o primeiro valor é só o ponto de partida, e queda não conta', () => {
  const { result, rerender } = setup({ value: undefined })
  expect(result.current).toBe(0)
  rerender({ value: 5 })
  expect(result.current).toBe(0)
  rerender({ value: 6 })
  expect(result.current).toBe(1)
  rerender({ value: 4 })
  expect(result.current).toBe(1)
  rerender({ value: 5 })
  expect(result.current).toBe(2)
})

it('com paused, guarda a subida e solta quando paused volta a falso', () => {
  const { result, rerender } = setup({ value: 5 })
  rerender({ value: 7, paused: true })
  expect(result.current).toBe(0)
  rerender({ value: 8, paused: true })
  expect(result.current).toBe(0)
  rerender({ value: 8, paused: false })
  expect(result.current).toBe(1)
})

it('o primeiro valor vale como ponto de partida mesmo com paused', () => {
  const { result, rerender } = setup({ value: undefined, paused: true })
  rerender({ value: 5, paused: true })
  rerender({ value: 5, paused: false })
  expect(result.current).toBe(0)
})
