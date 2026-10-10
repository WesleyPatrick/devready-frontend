const list = new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' })
const number = new Intl.NumberFormat('pt-BR')
const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

export function formatList(items: string[]) {
  return list.format(items)
}

export function formatNumber(value: number) {
  return number.format(value)
}

export function formatPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`
}

export function formatRelative(iso: string, now: Date = new Date()) {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return relative.format(0, 'second')
}

export function isoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
