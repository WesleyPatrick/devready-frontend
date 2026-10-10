import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
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
import { adminTexts } from './texts'
import type { AdminUser } from './types'
import type { RevealedPassword } from './usePasswordReset'

const t = adminTexts.temporaryPassword

type Props = {
  revealed: RevealedPassword | null
  onClose: () => void
  returnFocusTo: (user: AdminUser) => HTMLElement | null | undefined
}

type CopyState = 'idle' | 'copied' | 'failed'

export function TemporaryPasswordDialog({ revealed, onClose, returnFocusTo }: Props) {
  const open = revealed !== null
  useRegisterOverlay(open)
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {revealed && (
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            returnFocusTo(revealed.user)?.focus()
          }}
          className="motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
        >
          <RevealedContent key={revealed.password} revealed={revealed} onClose={onClose} />
        </DialogContent>
      )}
    </Dialog>
  )
}

function RevealedContent({
  revealed,
  onClose,
}: {
  revealed: RevealedPassword
  onClose: () => void
}) {
  const [copy, setCopy] = useState<CopyState>('idle')

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(revealed.password)
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.title(revealed.user.displayName)}</DialogTitle>
        <DialogDescription>{t.warning}</DialogDescription>
      </DialogHeader>
      <p className="rounded-md bg-muted px-3 py-2 text-center font-mono text-lg tracking-wider break-all select-all">
        {revealed.password}
      </p>
      {copy === 'failed' && <p className="text-sm text-destructive">{t.copyFailed}</p>}
      <p role="status" className="sr-only">
        {copy === 'copied' ? t.copiedStatus : null}
      </p>
      <DialogFooter>
        <Button variant="outline" onClick={() => void onCopy()}>
          {copy === 'copied' ? (
            <Check aria-hidden data-icon="inline-start" />
          ) : (
            <Copy aria-hidden data-icon="inline-start" />
          )}
          {copy === 'copied' ? t.copied : t.copy}
        </Button>
        <Button onClick={onClose}>{t.close}</Button>
      </DialogFooter>
    </>
  )
}
