import {
  CircleAlert,
  CircleCheck,
  CircleX,
  LoaderCircle,
  Timer,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { challengeTexts } from './texts'
import type { CaseStatus, Submission, SubmissionStatus } from './types'

const WAITING: readonly SubmissionStatus[] = ['QUEUED', 'RUNNING']

export function isFinal(status: SubmissionStatus) {
  return !WAITING.includes(status)
}

export const STATUS_ICONS: Record<SubmissionStatus, LucideIcon> = {
  QUEUED: LoaderCircle,
  RUNNING: LoaderCircle,
  PASSED: CircleCheck,
  FAILED: CircleX,
  COMPILE_ERROR: TriangleAlert,
  RUNTIME_ERROR: TriangleAlert,
  TIME_LIMIT: Timer,
  ERROR: CircleAlert,
}

export const STATUS_TONES: Record<SubmissionStatus, string> = {
  QUEUED: 'text-muted-foreground',
  RUNNING: 'text-muted-foreground',
  PASSED: 'text-easy',
  FAILED: 'text-hard',
  COMPILE_ERROR: 'text-hard',
  RUNTIME_ERROR: 'text-hard',
  TIME_LIMIT: 'text-medium',
  ERROR: 'text-muted-foreground',
}

export const CASE_ICONS: Record<CaseStatus, LucideIcon> = {
  PASSED: CircleCheck,
  FAILED: CircleX,
  ERROR: TriangleAlert,
  TIME_LIMIT: Timer,
}

export const CASE_TONES: Record<CaseStatus, string> = {
  PASSED: 'text-easy',
  FAILED: 'text-hard',
  ERROR: 'text-hard',
  TIME_LIMIT: 'text-medium',
}

const r = challengeTexts.result

export function verdictText(submission: Submission): string {
  const { status, kind, passedCount, totalCount, xpGained } = submission
  switch (status) {
    case 'QUEUED':
    case 'RUNNING':
      return r[status]
    case 'PASSED':
      return kind === 'RUN'
        ? r.announce.runPassed(totalCount)
        : r.announce.passed(passedCount, totalCount, xpGained)
    case 'FAILED':
      return r.announce.failed(passedCount, totalCount)
    case 'TIME_LIMIT':
      return r.announce.timeLimit(passedCount, totalCount)
    case 'COMPILE_ERROR':
    case 'RUNTIME_ERROR':
      return `${r[status]}.`
    case 'ERROR':
      return r.ERROR
  }
}
