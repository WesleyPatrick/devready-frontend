import type { CompetencyStatus, Difficulty, Level, QuestionStatus } from '@/lib/learning'

export type CompetencyCategory =
  'fundamento' | 'linguagem' | 'framework' | 'pratica' | 'comportamental'
export type Requirement = 'obrigatoria' | 'desejavel'
export type MaterialType = 'documentacao' | 'livro' | 'curso' | 'artigo' | 'video'
export type ChallengeLanguage = 'JAVA' | 'PYTHON' | 'JAVASCRIPT'

export type Competency = {
  slug: string
  name: string
  category: CompetencyCategory
  difficulty: Difficulty
  status: CompetencyStatus
  requirement: Requirement
  askedBy: string[]
  frequency: { jobs: number; total: number }
}

export type Track = {
  plan: {
    totalCompetencies: number
    doneCompetencies: number
    byDifficulty: Record<Difficulty, { done: number; total: number }>
    jobsAnalyzed: number
    missingCompanies: Array<{ slug: string; name: string }>
  }
  competencies: Competency[]
}

export type Material = {
  title: string
  url: string
  type: MaterialType
  language: 'pt' | 'en'
  free: boolean
}

export type CompetencyDetail = Competency & {
  description: string
  lockedReason: string | null
  materials: Material[]
  questions: Array<{
    slug: string
    title: string
    difficulty: Difficulty
    level: Level
    status: QuestionStatus
  }>
  challenges: Array<{
    slug: string
    title: string
    difficulty: Difficulty
    level: Level
    languages: ChallengeLanguage[]
    status: QuestionStatus
  }>
}
