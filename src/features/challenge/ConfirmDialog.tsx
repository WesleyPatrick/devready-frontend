import { useLayoutEffect, useRef } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRegisterOverlay } from '@/lib/motion/overlays'
import { challengeTexts } from './texts'

type Props = {
  open: boolean
  title: string
  body: string
  action: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
  returnFocusTo?: () => HTMLElement | null | undefined
}

export function ConfirmDialog({
  open,
  title,
  body,
  action,
  busy = false,
  error = null,
  onConfirm,
  onCancel,
  returnFocusTo,
}: Props) {
  useRegisterOverlay(open)
  const opener = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    if (open && !opener.current && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement
    }
  }, [open])
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          const preferred = returnFocusTo?.()
          const target = preferred?.isConnected ? preferred : opener.current
          if (target?.isConnected) target.focus()
          opener.current = null
        }}
        className="motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {challengeTexts.confirm.cancel}
          </Button>
          <Button
            aria-disabled={busy || undefined}
            className="aria-disabled:cursor-progress"
            onClick={() => {
              if (!busy) onConfirm()
            }}
          >
            {action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
