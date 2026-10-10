import type { CSSProperties } from 'react'

const ANGLES = [0, 60, 120, 180, 240, 300]

export function Sparks() {
  return ANGLES.map((angle) => (
    <span
      key={angle}
      data-slot="spark"
      aria-hidden
      className="absolute top-1/2 left-1/2 -mt-[3px] -ml-px h-1.5 w-0.5 animate-spark rounded-full bg-current motion-reduce:hidden"
      style={{ '--spark-angle': `${angle}deg` } as CSSProperties}
    />
  ))
}
