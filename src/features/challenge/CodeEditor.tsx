import { lazy, Suspense } from 'react'
import { Loading, Skeleton } from '@/components/Skeleton'
import type { EditorProps } from './editorProps'
import { challengeTexts } from './texts'

const MonacoEditor = lazy(() => import('./MonacoEditor'))

export function CodeEditor(props: EditorProps) {
  return (
    <Suspense
      fallback={
        <Loading label={challengeTexts.editor.loading} className="h-full">
          <Skeleton className="h-full rounded-none" />
        </Loading>
      }
    >
      <MonacoEditor {...props} />
    </Suspense>
  )
}
