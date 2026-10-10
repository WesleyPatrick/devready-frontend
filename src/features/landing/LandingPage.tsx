import { ArrowDown, Building2, Layers, Map as MapIcon, Target } from 'lucide-react'
import { Link } from 'react-router'
import { CompanyMonogram } from '@/components/CompanyMonogram'
import { CompetencyIcon } from '@/components/CompetencyIcon'
import { DataTable, type Column } from '@/components/DataTable'
import { FrequencyBar } from '@/components/FrequencyBar'
import { Panel } from '@/components/Panel'
import { StatusIcon } from '@/components/StatusIcon'
import { Button } from '@/components/ui/button'
import { paths } from '@/app/paths'
import { useGetCareerOptionsQuery } from '@/features/career/api'
import type { CompanyOption } from '@/features/career/types'
import { cn } from '@/lib/utils'
import { landingTexts } from './texts'
import { useScrollToHash } from './useScrollToHash'
import { Loading, Skeleton } from '@/components/Skeleton'

const t = landingTexts

const container = 'mx-auto max-w-6xl px-4'
const sectionTitle = 'text-2xl font-semibold tracking-tight sm:text-3xl'

type ExampleRow = (typeof t.example.rows)[number]

const exampleColumns: Column<ExampleRow>[] = [
  {
    key: 'status',
    header: t.example.columns.status,
    cell: (row) => <StatusIcon status={row.status} />,
  },
  {
    key: 'name',
    header: t.example.columns.competency,
    cell: (row) => (
      <span className="inline-flex items-center gap-2 font-medium">
        <CompetencyIcon category={row.category} className="text-brand" />
        {row.name}
      </span>
    ),
  },
  {
    key: 'jobs',
    header: t.example.columns.jobs,
    cell: (row) => <FrequencyBar jobs={row.jobs} total={t.example.total} />,
  },
]

export function LandingPage() {
  const { data, isError, isLoading } = useGetCareerOptionsQuery()
  const companies = data?.companies ?? []
  useScrollToHash(!isLoading)
  return (
    <>
      <Hero companyCount={companies.length} />
      <Companies companies={companies} loading={isLoading} hidden={isError && !data} />
      <HowItWorks />
      <FinalCall />
    </>
  )
}

function Hero({ companyCount }: { companyCount: number }) {
  return (
    <section
      aria-labelledby="landing-hero"
      className={cn(
        container,
        'grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_1fr]',
      )}
    >
      <div className="flex flex-col gap-6">
        <h1
          id="landing-hero"
          className="text-4xl/[1.08] font-bold tracking-tight text-balance sm:text-5xl"
        >
          {t.hero.title} <span className="text-brand">{t.hero.highlight}</span>.
        </h1>
        <p className="max-w-xl text-muted-foreground">{t.hero.body}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to={paths.register}>
              <MapIcon aria-hidden />
              {t.hero.primary}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#como-funciona">
              <ArrowDown aria-hidden />
              {t.hero.secondary}
            </a>
          </Button>
        </div>
        <ul role="list" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {companyCount > 0 && (
            <Fact icon={Building2}>
              <span className="font-mono">{t.hero.facts.companies(companyCount)}</span>
            </Fact>
          )}
          <Fact icon={Layers}>
            <span className="font-mono">{t.hero.facts.areas}</span>
          </Fact>
          <Fact icon={Target}>
            <span className="font-mono">{t.hero.facts.seniorities}</span>
          </Fact>
        </ul>
      </div>
      <Panel>
        <p className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {t.example.label}
        </p>
        <DataTable
          caption={t.example.label}
          columns={exampleColumns}
          rows={[...t.example.rows]}
          rowKey={(row) => row.name}
        />
      </Panel>
    </section>
  )
}

function Fact({ icon: Icon, children }: { icon: typeof Building2; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <Icon className="size-4 text-brand" aria-hidden />
      {children}
    </li>
  )
}

function Companies({
  companies,
  loading,
  hidden,
}: {
  companies: CompanyOption[]
  loading: boolean
  hidden: boolean
}) {
  if (hidden || (!loading && companies.length === 0)) return null
  return (
    <section
      id="empresas"
      aria-labelledby="landing-companies"
      className={cn(container, 'scroll-mt-16 py-10')}
    >
      <div className="max-w-2xl space-y-2">
        <h2 id="landing-companies" className={sectionTitle}>
          {t.companies.title}
        </h2>
        <p className="text-muted-foreground">{t.companies.body}</p>
      </div>
      {loading ? (
        <Loading label={t.companies.loading} className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </Loading>
      ) : (
        <ul role="list" className="mt-6 flex flex-wrap gap-2">
          {companies.map((company) => (
            <li key={company.slug} className="rounded-full bg-surface py-1 pr-3 pl-1 text-sm">
              <CompanyMonogram company={company} withName />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="landing-how"
      className={cn(container, 'scroll-mt-16 py-10')}
    >
      <h2 id="landing-how" className={sectionTitle}>
        {t.how.title}
      </h2>
      <ol role="list" className="mt-6 grid gap-6 md:grid-cols-3">
        {t.how.steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-md bg-surface font-mono text-sm text-brand"
            >
              {index + 1}
            </span>
            <div className="space-y-1">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-muted-foreground">{t.how.note}</p>
    </section>
  )
}

function FinalCall() {
  return (
    <section aria-labelledby="landing-cta" className={cn(container, 'pt-6 pb-16')}>
      <Panel className="flex flex-col items-start gap-3 p-6">
        <h2 id="landing-cta" className={sectionTitle}>
          {t.cta.title}
        </h2>
        <p className="text-muted-foreground">{t.cta.body}</p>
        <Button asChild size="lg">
          <Link to={paths.register}>{t.cta.action}</Link>
        </Button>
      </Panel>
    </section>
  )
}
