import type { Level } from '@/features/catalog/api'
import type {
  ChallengeLanguage,
  ChallengeLanguageInfo,
  VisibleCase,
} from '@/features/challenge/types'
import type { CompetencyRef } from '@/features/questions/types'
import type { Difficulty } from '@/lib/learning'

export const LESSON_MIN = 3

export type SessionFormat = 'LESSON' | 'SIMULATION'
export type SessionStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'FAILED'

export type SessionQuestion = {
  position: number
  slug: string
  title: string
  difficulty: Difficulty
  statement: string
  options: Array<{ id: string; text: string }>
  chosenOptionId: string | null
  correct?: boolean
  correctOptionId?: string
  explanation?: string
}

export type SessionChallenge = {
  position: number
  slug: string
  title: string
  difficulty: Difficulty
  statement: string
  languages: ChallengeLanguageInfo[]
  visibleCases: VisibleCase[]
  limits: { timeLimitMs: number; memoryLimitKb: number }
  submissionsUsed: number
  submissionsLeft: number
  bestSubmissionId: string | null
  lastSubmissionId: string | null
}

export type Session = {
  id: string
  format: SessionFormat
  status: SessionStatus
  area: { slug: string; name: string }
  level: Level
  competency: CompetencyRef | null
  startedAt: string
  deadlineAt: string | null
  questions: SessionQuestion[]
  challenges: SessionChallenge[]
}

export type SessionSummary = {
  id: string
  format: SessionFormat
  area: { slug: string; name: string }
  level: Level
  competency: CompetencyRef | null
  status: SessionStatus
  finalScore: number | null
  xpAwarded: number
  startedAt: string
  finishedAt: string | null
}

export type SessionAnswer = SessionQuestion & {
  xpGained: number
  sessionStatus: SessionStatus
  newAchievements: string[]
}

export type CompetencyResult = {
  competency: CompetencyRef | null
  hits: number
  total: number
  verdict: 'STRONG' | 'OK' | 'GAP'
  text: string
}

export type SessionResult = {
  status: 'COMPLETED'
  finalScore: number | null
  objectiveScore: number
  challengeScore: number | null
  xpAwarded: number
  finishedAt: string
  newAchievements: string[]
  competencies: CompetencyResult[]
  questions: Array<{
    position: number
    slug: string
    title: string
    correct: boolean
    chosenOptionId: string | null
    correctOptionId: string
    explanation: string
  }>
  challenges: Array<{
    position: number
    slug: string
    title: string
    passedCount: number
    totalCount: number
    bestSubmissionId: string | null
  }>
}

export type AnswerBody = { sessionId: string; position: number; optionId: string }
export type SessionCodeBody = {
  sessionId: string
  position: number
  language: ChallengeLanguage
  sourceCode: string
}
