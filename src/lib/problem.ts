import { appTexts } from '@/app/texts'

export type Problem = {
  status: number
  title: string
  detail: string
  fieldErrors: Record<string, string>
}

type ProblemBody = {
  title?: string
  detail?: string
  errors?: { field: string; message: string }[]
}

export function getProblem(error: unknown): Problem | null {
  if (!error || typeof error !== 'object' || !('status' in error)) return null
  const status = (error as { status: unknown }).status
  if (typeof status !== 'number') return null
  const data = ((error as { data?: ProblemBody }).data ?? {}) as ProblemBody
  const fieldErrors: Record<string, string> = {}
  for (const e of data.errors ?? []) fieldErrors[e.field] = e.message
  return {
    status,
    title: data.title ?? appTexts.problem.title,
    detail: data.detail ?? appTexts.problem.detail,
    fieldErrors,
  }
}
