import { useState } from 'react'
import { useNavigate } from 'react-router'
import { challengePath } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { useLazyGetSubmissionCodeQuery } from '@/features/challenge/api'
import { ConfirmDialog } from '@/features/challenge/ConfirmDialog'
import { saveDraft } from '@/features/challenge/drafts'
import { saveLastLanguage } from '@/features/challenge/language'
import { challengeTexts } from '@/features/challenge/texts'
import { sessionTexts } from './texts'

const t = sessionTexts.result

export function OpenInEditor({ slug, submissionId }: { slug: string; submissionId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [load, { data, isFetching, isError }] = useLazyGetSubmissionCodeQuery()
  const navigate = useNavigate()

  function openDialog() {
    setConfirming(true)
    void load(submissionId)
  }

  async function confirm() {
    try {
      const submission = data ?? (await load(submissionId).unwrap())
      saveDraft(slug, submission.language, submission.sourceCode)
      saveLastLanguage(submission.language)
      setConfirming(false)
      navigate(challengePath(slug))
    } catch {}
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={openDialog}>
        {t.open}
      </Button>
      <ConfirmDialog
        open={confirming}
        title={t.openTitle}
        body={t.openBody(
          data ? challengeTexts.languages[data.language] : challengeTexts.editor.label,
        )}
        action={t.openAction}
        busy={isFetching}
        error={isError ? t.openError : null}
        onConfirm={() => void confirm()}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
