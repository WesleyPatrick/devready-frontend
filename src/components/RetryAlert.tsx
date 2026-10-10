import { CircleAlert } from 'lucide-react'
import { appTexts } from '@/app/texts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type Props = { message: string; retrying: boolean; onRetry: () => void }

export function RetryAlert({ message, retrying, onRetry }: Props) {
  return (
    <Alert variant="destructive">
      <CircleAlert aria-hidden />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <Button
          size="sm"
          variant="outline"
          aria-disabled={retrying || undefined}
          className="aria-disabled:cursor-progress"
          onClick={() => {
            if (!retrying) onRetry()
          }}
        >
          {appTexts.retry}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
