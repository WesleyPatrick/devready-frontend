import { useEffect, useMemo } from 'react'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { appTexts } from '@/app/texts'
import { getProblem } from './problem'

export function useFormProblem<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
) {
  const problem = useMemo(() => getProblem(error), [error])

  useEffect(() => {
    if (!problem) return
    for (const [field, message] of Object.entries(problem.fieldErrors)) {
      if ((fields as readonly string[]).includes(field)) setError(field as Path<T>, { message })
    }
  }, [problem, fields, setError])

  const alertMessage = useMemo(() => {
    if (!error) return null
    if (!problem) return appTexts.networkError
    const entries = Object.entries(problem.fieldErrors)
    if (entries.length === 0) return problem.detail
    const unknown = entries
      .filter(([field]) => !(fields as readonly string[]).includes(field))
      .map(([, message]) => message)
    return unknown.length > 0 ? unknown.join(' ') : null
  }, [error, problem, fields])

  return { alertMessage }
}
