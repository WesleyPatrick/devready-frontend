import type { CompetencyRef } from '@/features/questions/types'
import type { ChallengeLanguage } from '@/features/track/types'
import type { Difficulty, QuestionStatus } from '@/lib/learning'

export type { ChallengeLanguage }

export type ChallengeLanguageInfo = {
  language: ChallengeLanguage
  runtime: string
  functionName: string
  starterCode: string
}

export type VisibleCase = { position: number; args: unknown[]; expected: unknown }

export type Challenge = {
  slug: string
  title: string
  difficulty: Difficulty
  competency: CompetencyRef | null
  askedBy: string[]
  status: QuestionStatus
  xp: number
  statement: string
  languages: ChallengeLanguageInfo[]
  visibleCases: VisibleCase[]
  hiddenCaseCount: number
  limits: { timeLimitMs: number; memoryLimitKb: number }
  approachSummary: string | null
}

export type SubmissionKind = 'RUN' | 'SUBMIT'

export type SubmissionStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT'
  | 'ERROR'

export type CaseStatus = 'PASSED' | 'FAILED' | 'ERROR' | 'TIME_LIMIT'

export type CaseResult = {
  position: number
  visible: boolean
  status: CaseStatus
  args?: unknown[]
  expected?: unknown
  actual?: unknown
  error?: string
  timeMs?: number
}

export type Submission = {
  id: string
  challengeSlug: string
  kind: SubmissionKind
  language: ChallengeLanguage
  sourceCode: string
  status: SubmissionStatus
  passedCount: number
  totalCount: number
  compileOutput: string | null
  errorMessage: string | null
  xpGained: number
  createdAt: string
  finishedAt: string | null
  cases: CaseResult[]
  sealed: boolean
}

export type SubmissionSummary = Pick<
  Submission,
  'id' | 'language' | 'status' | 'passedCount' | 'totalCount' | 'createdAt'
>

export type SubmissionTicket = { id: string; status: SubmissionStatus }

export type CodeBody = { slug: string; language: ChallengeLanguage; sourceCode: string }
