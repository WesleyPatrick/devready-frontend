import { appTexts } from '@/app/texts'

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type CompetencyStatus = 'DONE' | 'IN_PROGRESS' | 'NOT_STARTED' | 'LOCKED'
export type QuestionStatus = 'SOLVED' | 'ATTEMPTED' | 'NOT_STARTED'
export type Level = 'JUNIOR' | 'PLENO' | 'SENIOR'
export type CompanyRef = { slug: string; name: string }

export const DIFFICULTIES: readonly Difficulty[] = ['EASY', 'MEDIUM', 'HARD']

export const LEVELS: readonly Level[] = ['JUNIOR', 'PLENO', 'SENIOR']

export function visibleLevels(seniority: Level): Level[] {
  return LEVELS.slice(0, LEVELS.indexOf(seniority) + 1)
}

export const DIFFICULTY_TONE: Record<Difficulty, string> = {
  EASY: 'text-easy',
  MEDIUM: 'text-medium',
  HARD: 'text-hard',
}
export const DIFFICULTY_FILL: Record<Difficulty, string> = {
  EASY: 'bg-easy',
  MEDIUM: 'bg-medium',
  HARD: 'bg-hard',
}
export const DIFFICULTY_STROKE: Record<Difficulty, string> = {
  EASY: 'stroke-easy',
  MEDIUM: 'stroke-medium',
  HARD: 'stroke-hard',
}

export const ALL_FILTER = 'all'

export function categoryLabel(category: string) {
  return (appTexts.categories as Record<string, string>)[category] ?? category
}

export function companiesOf(slugs: string[], companies: CompanyRef[]) {
  return companies.filter((c) => slugs.includes(c.slug))
}
