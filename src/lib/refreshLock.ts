export const REFRESH_LOCK = 'devready-refresh'

export function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks
  if (!locks?.request) return task()
  return locks.request(REFRESH_LOCK, task)
}
