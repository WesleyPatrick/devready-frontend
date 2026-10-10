import { renderHook } from '@testing-library/react'
import type { Achievement } from './types'
import { useUnlocks } from './useUnlocks'

const item = (slug: string, unlocked: boolean): Achievement => ({
  slug,
  name: slug,
  description: '',
  icon: 'flame',
  unlockedAt: unlocked ? 'x' : null,
})

type Props = { list: Achievement[] | undefined; paused?: boolean }

it('as já desbloqueadas na primeira carga não contam; as novas sim', () => {
  const { result, rerender } = renderHook(
    ({ list, paused }: Props) => useUnlocks(list, { paused }),
    {
      initialProps: { list: undefined } as Props,
    },
  )
  rerender({ list: [item('a', true), item('b', false)] })
  expect(result.current.pulse).toBe(0)
  rerender({ list: [item('a', true), item('b', true)] })
  expect(result.current.pulse).toBe(1)
  expect(result.current.items.map((a) => a.slug)).toEqual(['b'])
})

it('com paused, espera para liberar', () => {
  const { result, rerender } = renderHook(
    ({ list, paused }: Props) => useUnlocks(list, { paused }),
    {
      initialProps: { list: [item('b', false)] } as Props,
    },
  )
  rerender({ list: [item('b', true)], paused: true })
  expect(result.current.pulse).toBe(0)
  rerender({ list: [item('b', true)], paused: false })
  expect(result.current.pulse).toBe(1)
})
