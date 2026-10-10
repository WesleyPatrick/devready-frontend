export const hintId = (field: string) => `${field}-hint`
export const errorId = (field: string) => `${field}-error`

export function fieldA11y(field: string, error: string | undefined, withHint = false) {
  const describedBy = [withHint ? hintId(field) : null, error ? errorId(field) : null]
    .filter(Boolean)
    .join(' ')
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  }
}
