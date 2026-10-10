export function openSessionIdOf(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('status' in error)) return null
  if ((error as { status: unknown }).status !== 409) return null
  const data = (error as { data?: { sessionId?: unknown } }).data
  return typeof data?.sessionId === 'string' ? data.sessionId : null
}
