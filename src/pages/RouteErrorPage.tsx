import { RotateCw } from 'lucide-react'
import { useRouteError } from 'react-router'
import { paths } from '@/app/paths'
import { appTexts } from '@/app/texts'
import { Button } from '@/components/ui/button'
import { reloadPage } from '@/lib/reloadPage'

const t = appTexts.routeError

const CHUNK_LOAD_ERROR =
  /dynamically imported module|Importing a module script failed|error loading dynamically|Unable to preload CSS/i

function isChunkLoadError(error: unknown) {
  return error instanceof Error && CHUNK_LOAD_ERROR.test(error.message)
}

export function RouteErrorPage() {
  const updated = isChunkLoadError(useRouteError())
  return (
    <main className="grid min-h-svh place-items-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md space-y-4 rounded-lg bg-surface px-6 py-10 text-center">
        <h1 className="text-xl font-semibold">{updated ? t.updatedTitle : t.title}</h1>
        <p className="text-sm text-muted-foreground">{updated ? t.updatedBody : t.body}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button onClick={reloadPage}>
            <RotateCw aria-hidden />
            {t.reload}
          </Button>
          <Button asChild variant="outline">
            <a href={paths.landing}>{t.back}</a>
          </Button>
        </div>
      </section>
    </main>
  )
}
