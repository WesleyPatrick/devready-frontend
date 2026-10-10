import confetti from 'canvas-confetti'
import { burstFrom, cannons } from './celebrate'
import { setReducedMotionForTests } from './reducedMotion'

vi.mock('canvas-confetti', () => ({ default: vi.fn(() => null) }))

afterEach(() => {
  vi.mocked(confetti).mockClear()
  document.documentElement.style.removeProperty('--brand')
})

it('com movimento reduzido, não dispara nada', async () => {
  await cannons()
  await burstFrom(document.body)
  expect(confetti).not.toHaveBeenCalled()
})

it('canhões saem dos dois cantos de baixo, acima do diálogo', async () => {
  setReducedMotionForTests(false)
  await cannons()
  expect(confetti).toHaveBeenCalledTimes(2)
  const [left, right] = vi.mocked(confetti).mock.calls.map(([options]) => options!)
  expect(left.origin).toEqual({ x: 0, y: 1 })
  expect(right.origin).toEqual({ x: 1, y: 1 })
  expect(left.zIndex).toBe(60)
})

it('o estouro sai do centro do elemento, com as cores do tema', async () => {
  setReducedMotionForTests(false)
  document.documentElement.style.setProperty('--brand', '#f2994a')
  const element = document.createElement('div')
  element.getBoundingClientRect = () => ({ left: 100, top: 50, width: 200, height: 100 }) as DOMRect
  await burstFrom(element)
  const options = vi.mocked(confetti).mock.calls[0][0]!
  expect(options.origin!.x).toBeCloseTo(200 / window.innerWidth)
  expect(options.origin!.y).toBeCloseTo(100 / window.innerHeight)
  expect(options.colors).toContain('#f2994a')
})

it('sem elemento, não dispara', async () => {
  setReducedMotionForTests(false)
  await burstFrom(null)
  expect(confetti).not.toHaveBeenCalled()
})
