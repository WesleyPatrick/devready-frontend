import { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { sessionPath } from '@/app/paths'
import { Panel } from '@/components/Panel'
import { RetryAlert } from '@/components/RetryAlert'
import { Loading, Skeleton } from '@/components/Skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useGetCareerProfileQuery } from '@/features/career/api'
import { useStartSimulationMutation } from '@/features/session/api'
import { openSessionIdOf } from '@/features/session/errors'
import { getProblem } from '@/lib/problem'
import { useGetAreasQuery, type Area, type Level } from './api'
import { AreaCard } from './AreaCard'
import { CurrentSessionBanner } from './CurrentSessionBanner'
import { LevelSelect } from './LevelSelect'
import { SessionHistory } from './SessionHistory'
import { catalogTexts } from './texts'

export function NewSimulationPage() {
  const { data: areas, error, isFetching, refetch } = useGetAreasQuery()
  const { data: profile } = useGetCareerProfileQuery()
  const [areaSlug, setAreaSlug] = useState<string | null>(null)
  const [chosenLevel, setChosenLevel] = useState<Level | null>(null)
  const [startSimulation, start] = useStartSimulationMutation()
  const navigate = useNavigate()
  const radioName = useId()

  const goalArea = areas?.find((a) => a.slug === profile?.stack.area) ?? null
  const selectedArea = areas?.find((a) => a.slug === areaSlug) ?? goalArea
  const levels = selectedArea?.levels ?? []
  const level = pickLevel(levels, chosenLevel, profile?.seniority)
  const canStart = selectedArea !== null && levels.includes(level)
  const openId = openSessionIdOf(start.error)

  function selectArea(area: Area) {
    setAreaSlug(area.slug)
  }

  async function begin() {
    if (!selectedArea || !canStart || start.isLoading) return
    start.reset()
    try {
      const session = await startSimulation({ area: selectedArea.slug, level }).unwrap()
      navigate(sessionPath(session.id))
    } catch {}
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{catalogTexts.title}</h1>
        <p className="text-muted-foreground">{catalogTexts.subtitle}</p>
      </div>

      <CurrentSessionBanner />

      {!areas && !error && (
        <Loading label={catalogTexts.loading} className="space-y-1 rounded-lg bg-surface p-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </Loading>
      )}
      {error && !areas && (
        <RetryAlert
          message={catalogTexts.error}
          retrying={isFetching}
          onRetry={() => void refetch()}
        />
      )}

      {areas?.length === 0 && <p className="text-muted-foreground">{catalogTexts.empty}</p>}

      {areas && areas.length > 0 && (
        <>
          <Panel className="p-2">
            <fieldset className="min-w-0 space-y-1">
              <legend className="sr-only">{catalogTexts.area}</legend>
              {areas.map((area) => (
                <AreaCard
                  key={area.slug}
                  area={area}
                  name={radioName}
                  selected={area.slug === selectedArea?.slug}
                  onSelect={selectArea}
                />
              ))}
            </fieldset>
          </Panel>
          {selectedArea && levels.length > 0 && (
            <LevelSelect levels={levels} value={level} onChange={setChosenLevel} />
          )}
          {selectedArea && levels.length === 0 && (
            <p className="text-sm text-muted-foreground">{catalogTexts.noLevels}</p>
          )}
          <div className="space-y-2">
            <Button
              aria-disabled={!canStart || start.isLoading || undefined}
              className="aria-disabled:cursor-not-allowed"
              onClick={() => void begin()}
            >
              {start.isLoading ? catalogTexts.starting : catalogTexts.start}
            </Button>
            {!selectedArea && (
              <p className="text-sm text-muted-foreground">{catalogTexts.chooseArea}</p>
            )}
            {start.error && (
              <Alert variant="destructive">
                <AlertDescription className="flex flex-wrap items-center gap-2">
                  {getProblem(start.error)?.detail ?? catalogTexts.startError}
                  {openId && (
                    <Link
                      className="font-medium text-brand underline-offset-4 hover:underline"
                      to={sessionPath(openId)}
                    >
                      {catalogTexts.continueOpen}
                    </Link>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </>
      )}

      <SessionHistory />
    </section>
  )
}

function pickLevel(levels: Level[], chosen: Level | null, goal: Level | undefined): Level {
  if (chosen && levels.includes(chosen)) return chosen
  if (goal && levels.includes(goal)) return goal
  return levels[0] ?? 'JUNIOR'
}
