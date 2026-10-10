let override: boolean | undefined

export function prefersReducedMotion(): boolean {
  if (override !== undefined) return override
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function setReducedMotionForTests(value: boolean | undefined) {
  override = value
}
