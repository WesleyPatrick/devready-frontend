import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { Skeleton } from '@/components/Skeleton'
import { editorOptions, MONACO_LANGUAGES, type EditorProps } from './editorProps'
import { monaco } from './monacoSetup'
import { buildTheme, THEME_NAME } from './monacoTheme'

function subscribeDark(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

function isDark() {
  return document.documentElement.classList.contains('dark')
}

function applyEditorTheme(dark: boolean) {
  const style = getComputedStyle(document.documentElement)
  monaco.editor.defineTheme(
    THEME_NAME,
    buildTheme((name) => style.getPropertyValue(name), dark),
  )
  monaco.editor.setTheme(THEME_NAME)
}

export default function MonacoEditor({
  value,
  language,
  modelPath,
  label,
  onChange,
  onRun,
}: EditorProps) {
  const dark = useSyncExternalStore(subscribeDark, isDark)
  const options = useMemo(() => editorOptions(label), [label])
  const runRef = useRef(onRun)

  useEffect(() => {
    runRef.current = onRun
  }, [onRun])

  useEffect(() => {
    applyEditorTheme(dark)
  }, [dark])

  function handleMount(instance: editor.IStandaloneCodeEditor) {
    instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current())
    void document.fonts?.ready.then(() => monaco.editor.remeasureFonts())
  }

  return (
    <Editor
      height="100%"
      path={modelPath}
      language={MONACO_LANGUAGES[language]}
      value={value}
      theme={THEME_NAME}
      options={options}
      loading={<Skeleton className="h-full rounded-none" />}
      beforeMount={() => applyEditorTheme(isDark())}
      onMount={handleMount}
      onChange={(next) => onChange(next ?? '')}
    />
  )
}
