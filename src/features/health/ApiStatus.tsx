import { useGetHealthQuery } from './api'
import { healthTexts } from './texts'

export function ApiStatus() {
  const { data, isLoading, isError } = useGetHealthQuery(undefined, { pollingInterval: 30_000 })

  const online = !isLoading && !isError && data?.status === 'UP'
  const text = isLoading ? healthTexts.checking : online ? healthTexts.online : healthTexts.offline
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      {!isLoading && (
        <span
          aria-hidden
          className={`size-2 rounded-full ${online ? 'bg-easy' : 'bg-destructive'}`}
        />
      )}
      {text}
    </span>
  )
}
