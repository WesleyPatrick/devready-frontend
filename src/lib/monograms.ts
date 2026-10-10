export type Monogram = { initials: string; color: string }

const MONOGRAMS: Record<string, Monogram> = {
  amazon: { initials: 'Am', color: '#f5a65b' },
  apple: { initials: 'Ap', color: '#c9c9c9' },
  google: { initials: 'G', color: '#7fb0f5' },
  meta: { initials: 'Me', color: '#8fb3ff' },
  microsoft: { initials: 'Ms', color: '#9fd08a' },
  ifood: { initials: 'iF', color: '#f28b8b' },
  'mercado-livre': { initials: 'ML', color: '#f5d76e' },
  nubank: { initials: 'Nu', color: '#b18cf2' },
  picpay: { initials: 'PP', color: '#7fe0a8' },
  stone: { initials: 'St', color: '#8fe0c4' },
}

const NEUTRAL = '#a3a3a3'

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const raw = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function monogramOf(slug: string, name: string): Monogram {
  return MONOGRAMS[slug] ?? { initials: initialsOf(name), color: NEUTRAL }
}
