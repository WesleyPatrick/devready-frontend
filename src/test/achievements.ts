import { http, HttpResponse } from 'msw'
import type { Achievement, Progress } from '@/features/progress/types'
import { problem } from './problem'

const CATALOG: Array<Omit<Achievement, 'unlockedAt'>> = [
  {
    slug: 'primeira-questao',
    name: 'Primeira questão',
    description: 'Respondeu a primeira questão.',
    icon: 'check',
  },
  {
    slug: 'dez-questoes',
    name: 'Dez questões',
    description: 'Resolveu dez questões.',
    icon: 'check-check',
  },
  {
    slug: 'sequencia-3',
    name: 'Três dias seguidos',
    description: 'Praticou três dias seguidos.',
    icon: 'flame',
  },
  {
    slug: 'sequencia-7',
    name: 'Uma semana seguida',
    description: 'Praticou sete dias seguidos.',
    icon: 'flame',
  },
  {
    slug: 'sequencia-30',
    name: 'Um mês seguido',
    description: 'Praticou trinta dias seguidos.',
    icon: 'calendar',
  },
  {
    slug: 'mil-xp',
    name: 'Mil XP',
    description: 'Chegou a 1.000 pontos de experiência.',
    icon: 'zap',
  },
  {
    slug: 'cinco-mil-xp',
    name: 'Cinco mil XP',
    description: 'Chegou a 5.000 pontos de experiência.',
    icon: 'trophy',
  },
  {
    slug: 'meta-cinco-vezes',
    name: 'Meta em dia',
    description: 'Cumpriu a meta do dia cinco vezes.',
    icon: 'target',
  },
  {
    slug: 'primeira-competencia',
    name: 'Primeira competência',
    description: 'Concluiu uma competência da trilha.',
    icon: 'book',
  },
  {
    slug: 'primeira-simulacao',
    name: 'Primeira simulação',
    description: 'Terminou uma simulação cronometrada.',
    icon: 'timer',
  },
]

const DAY = 86_400_000
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString()

const initial = () =>
  new Map<string, string>([
    ['primeira-questao', ago(33)],
    ['sequencia-3', ago(4)],
    ['mil-xp', ago(1)],
  ])

let unlocked = initial()

export function resetAchievements() {
  unlocked = initial()
}

export function unlockAchievement(slug: string): boolean {
  if (unlocked.has(slug)) return false
  unlocked.set(slug, new Date().toISOString())
  return true
}

export function checkProgressAchievements(progress: Progress): string[] {
  const earned: string[] = []
  if (progress.streakDays >= 3) earned.push('sequencia-3')
  if (progress.streakDays >= 7) earned.push('sequencia-7')
  if (progress.streakDays >= 30) earned.push('sequencia-30')
  if (progress.xp >= 1000) earned.push('mil-xp')
  if (progress.xp >= 5000) earned.push('cinco-mil-xp')
  return earned.filter(unlockAchievement)
}

export function achievementsList(): Achievement[] {
  return CATALOG.map((item) => ({ ...item, unlockedAt: unlocked.get(item.slug) ?? null }))
}

export function achievementHandlers() {
  return [
    http.get('/api/v1/me/achievements', ({ request }) =>
      request.headers.get('Authorization')
        ? HttpResponse.json(achievementsList())
        : problem(401, 'Não autenticado', 'Token ausente.'),
    ),
  ]
}
