import type { Options } from 'canvas-confetti'
import { prefersReducedMotion } from './reducedMotion'

const TOKENS = ['--brand', '--easy', '--medium', '--hard', '--foreground']
const Z_INDEX = 60

function palette() {
  const style = getComputedStyle(document.documentElement)
  return TOKENS.map((token) => style.getPropertyValue(token).trim()).filter(Boolean)
}

async function fire(shots: Options[]) {
  if (prefersReducedMotion()) return
  const { default: confetti } = await import('canvas-confetti')
  const colors = palette()
  await Promise.all(
    shots.map((shot) =>
      confetti({
        zIndex: Z_INDEX,
        disableForReducedMotion: true,
        ...(colors.length > 0 ? { colors } : {}),
        ...shot,
      }),
    ),
  )
}

export function cannons() {
  return fire([
    { particleCount: 140, angle: 60, spread: 55, startVelocity: 65, origin: { x: 0, y: 1 } },
    { particleCount: 140, angle: 120, spread: 55, startVelocity: 65, origin: { x: 1, y: 1 } },
  ])
}

export function burstFrom(element: Element | null, particleCount = 90) {
  if (!element) return Promise.resolve()
  const box = element.getBoundingClientRect()
  return fire([
    {
      particleCount,
      spread: 90,
      startVelocity: 32,
      origin: {
        x: (box.left + box.width / 2) / window.innerWidth,
        y: (box.top + box.height / 2) / window.innerHeight,
      },
    },
  ])
}
