import type { Difficulty, Level, QuestionStatus } from '@/lib/learning'

export type ProblemType = 'QUESTION' | 'CHALLENGE'

export type CompetencyRef = { slug: string; name: string; category: string }

export type ProblemSummary = {
  slug: string
  type: ProblemType
  title: string
  competency: CompetencyRef | null
  difficulty: Difficulty
  level: Level
  status: QuestionStatus
  acceptance: number | null
  askedBy: string[]
  inExam: boolean
}

export type QuestionPage = {
  items: ProblemSummary[]
  page: number
  totalPages: number
  totalItems: number
}

export type QuestionFilters = {
  page?: number
  size?: number
  type?: ProblemType
  status?: QuestionStatus
  difficulty?: Difficulty
  competency?: string
  company?: string
  level?: Level
}

export type Question = {
  slug: string
  title: string
  competency: CompetencyRef | null
  difficulty: Difficulty
  level: Level
  status: QuestionStatus
  estimatedMinutes: number
  statement: string
  options: Array<{ id: string; text: string }>
  xp: number
}

export type AnswerBody = { slug: string; optionId: string }
export type AnswerResult = {
  correct: boolean
  correctOptionId: string
  explanation: string
  xpGained: number
  newAchievements: string[]
}
