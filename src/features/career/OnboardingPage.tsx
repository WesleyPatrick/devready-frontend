import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleAlert, LoaderCircle } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { RetryAlert } from '@/components/RetryAlert'
import { Stepper } from '@/components/Stepper'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { paths } from '@/app/paths'
import { appTexts } from '@/app/texts'
import type { Level } from '@/features/catalog/api'
import { getProblem } from '@/lib/problem'
import {
  useGetCareerOptionsQuery,
  useGetCareerProfileQuery,
  useSaveCareerProfileMutation,
} from './api'
import { inScreenOrder, MAX_COMPANIES } from './companies'
import { CompanyStep } from './CompanyStep'
import { SeniorityStep } from './SeniorityStep'
import { StackStep } from './StackStep'
import { STEP_ICONS } from './stepIcons'
import { careerTexts } from './texts'
import { Loading, Skeleton } from '@/components/Skeleton'

const t = careerTexts.onboarding
type Step = 0 | 1 | 2
const LAST_STEP: Step = 2
const STEP_TEXTS = [t.companies, t.stack, t.seniority] as const

function destination(from: unknown) {
  if (typeof from !== 'string') return paths.track
  let url: URL
  try {
    url = new URL(from, window.location.origin)
  } catch {
    return paths.track
  }
  const sameOrigin = url.origin === window.location.origin
  const onboarding = url.pathname.replace(/\/+$/, '').toLowerCase() === paths.onboarding
  return sameOrigin && !onboarding ? url.pathname + url.search + url.hash : paths.track
}

export function OnboardingPage() {
  const [params] = useSearchParams()
  const editing = params.get('edit') === '1'
  const location = useLocation()
  const navigate = useNavigate()
  const options = useGetCareerOptionsQuery()
  const current = useGetCareerProfileQuery()
  const [save, saving] = useSaveCareerProfileMutation()
  const [step, setStep] = useState<Step>(0)
  const [companies, setCompanies] = useState<string[]>([])
  const [stack, setStack] = useState<string | null>(null)
  const [seniority, setSeniority] = useState<Level | null>(null)
  const [preloaded, setPreloaded] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)

  const data = options.data
  const profile = editing ? current.data : undefined
  const profileMissing = getProblem(current.error)?.status === 404
  const profileFailed = editing && !!current.error && !profileMissing && !current.data
  const optionsFailed = !!options.error && !data
  const ready = !!data && (!editing || !!profile || (current.isError && profileMissing))

  if (data && profile && !preloaded) {
    const known = new Set(data.companies.map((company) => company.slug))
    setPreloaded(true)
    setCompanies(profile.companies.map((company) => company.slug).filter((s) => known.has(s)))
    setStack(data.stacks.some((s) => s.slug === profile.stack.slug) ? profile.stack.slug : null)
    setSeniority(profile.seniority)
  }

  useEffect(() => {
    if (ready) heading.current?.focus()
  }, [ready, step])

  const chosen = [companies.length > 0, stack !== null, seniority !== null]
  const canContinue = ready && chosen[step]
  const full = companies.length >= MAX_COMPANIES
  const saveError = saving.isError
    ? (getProblem(saving.error)?.detail ?? appTexts.networkError)
    : null

  function back() {
    saving.reset()
    setStep((step - 1) as Step)
  }

  async function finish() {
    if (!data || stack === null || seniority === null) return
    try {
      await save({ companies: inScreenOrder(data.companies, companies), stack, seniority }).unwrap()
    } catch {
      return
    }
    const from = (location.state as { from?: unknown } | null)?.from
    navigate(editing ? paths.profile : destination(from), {
      replace: true,
      state: editing ? undefined : { celebrate: true },
    })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canContinue || saving.isLoading) return
    if (step < LAST_STEP) setStep((step + 1) as Step)
    else void finish()
  }

  function retry() {
    if (optionsFailed) void options.refetch()
    if (profileFailed) void current.refetch()
  }

  if (!editing && saving.isUninitialized && current.data)
    return <Navigate to={`${paths.onboarding}?edit=1`} replace />

  const texts = STEP_TEXTS[step]

  return (
    <div className="space-y-8">
      <Stepper steps={t.steps} current={step} label={t.stepsLabel} icons={STEP_ICONS} />

      {data && ready ? (
        <form onSubmit={onSubmit} className="rounded-lg bg-surface">
          <div
            key={step}
            className="space-y-6 p-5 animate-in duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:p-8"
          >
            <div className="space-y-2">
              <h1
                ref={heading}
                tabIndex={-1}
                className="text-2xl font-semibold tracking-tight outline-none"
              >
                {texts.title}
              </h1>
              <p className="text-muted-foreground">{texts.body}</p>
            </div>

            {step === 0 && (
              <CompanyStep
                companies={data.companies}
                selected={companies}
                onChange={setCompanies}
              />
            )}
            {step === 1 && <StackStep stacks={data.stacks} selected={stack} onChange={setStack} />}
            {step === 2 && (
              <SeniorityStep
                seniorities={data.seniorities}
                selected={seniority}
                onChange={setSeniority}
              />
            )}

            {saveError && (
              <Alert variant="destructive">
                <CircleAlert aria-hidden />
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
          </div>

          <div
            data-sticky-footer
            className="sticky bottom-0 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-b-lg border-t bg-surface px-5 py-4 sm:px-8"
          >
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={back}
                disabled={saving.isLoading}
              >
                <ArrowLeft aria-hidden data-icon="inline-start" />
                {t.back}
              </Button>
            ) : editing ? (
              <Button asChild variant="ghost" size="lg">
                <Link to={paths.profile} replace>
                  {t.cancel}
                </Link>
              </Button>
            ) : null}
            {step === 0 && (
              <p
                aria-live="polite"
                className="order-first basis-full text-sm font-medium sm:order-none sm:flex-1"
              >
                {full ? t.companies.limit : t.companies.counter(companies.length)}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="ml-auto px-4 aria-disabled:cursor-progress"
              disabled={!canContinue}
              aria-disabled={saving.isLoading || undefined}
            >
              {step < LAST_STEP ? (
                <>
                  {t.next}
                  <ArrowRight aria-hidden data-icon="inline-end" />
                </>
              ) : saving.isLoading ? (
                <>
                  <LoaderCircle
                    aria-hidden
                    data-icon="inline-start"
                    className="animate-spin motion-reduce:animate-none"
                  />
                  {t.saving}
                </>
              ) : (
                <>
                  <Check aria-hidden data-icon="inline-start" />
                  {t.finish}
                </>
              )}
            </Button>
          </div>
        </form>
      ) : optionsFailed || profileFailed ? (
        <RetryAlert
          message={optionsFailed ? t.loadError : t.profileLoadError}
          retrying={options.isFetching || current.isFetching}
          onRetry={retry}
        />
      ) : (
        <Loading label={t.loading} className="space-y-4 rounded-lg bg-surface p-5 sm:p-8">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </Loading>
      )}
    </div>
  )
}
