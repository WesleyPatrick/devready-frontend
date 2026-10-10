import {
  Building2,
  CircleCheck,
  CircleDashed,
  Contrast,
  GraduationCap,
  Layers,
  ListChecks,
  ListFilter,
  Shapes,
  SquareCode,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import { createElement, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { challengePath } from '@/app/paths'
import { appTexts } from '@/app/texts'
import { CompanyStack } from '@/components/CompanyMonogram'
import { CompetencyIcon } from '@/components/CompetencyIcon'
import { DataTable, type Column } from '@/components/DataTable'
import { DifficultyLabel } from '@/components/DifficultyLabel'
import { FilterMenu } from '@/components/FilterMenu'
import { LevelTag } from '@/components/LevelTag'
import { Panel } from '@/components/Panel'
import { QuestionText } from '@/components/QuestionText'
import { RetryAlert } from '@/components/RetryAlert'
import { StatusIcon } from '@/components/StatusIcon'
import { StatusTabs } from '@/components/StatusTabs'
import { useGetCareerProfileQuery } from '@/features/career/api'
import { formatPercent } from '@/lib/format'
import {
  ALL_FILTER,
  companiesOf,
  DIFFICULTIES,
  visibleLevels,
  type CompanyRef,
  type Difficulty,
  type Level,
  type QuestionStatus,
} from '@/lib/learning'
import { useGetTrackQuery } from '@/features/track/api'
import { rowAction } from '@/lib/rowAction'
import { cn } from '@/lib/utils'
import { useGetQuestionsQuery } from './api'
import { PAGE_SIZE } from './paging'
import { Pagination } from './Pagination'
import { QuestionDialog } from './QuestionDialog'
import { questionsTexts } from './texts'
import type { ProblemSummary, ProblemType } from './types'
import { Loading, Skeleton, TableSkeleton } from '@/components/Skeleton'

const t = questionsTexts.page

const STATUSES: readonly QuestionStatus[] = ['SOLVED', 'ATTEMPTED', 'NOT_STARTED']
const TYPES: readonly ProblemType[] = ['QUESTION', 'CHALLENGE']
const TYPE_ICONS: Record<ProblemType, LucideIcon> = { QUESTION: ListChecks, CHALLENGE: SquareCode }

type Tab = QuestionStatus | typeof ALL_FILTER

function NoValue({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden className="text-muted-foreground">
        —
      </span>
      <span className="sr-only">{label}</span>
    </>
  )
}

function TypeIcon({ type }: { type: ProblemType }) {
  return (
    <>
      {createElement(TYPE_ICONS[type], {
        className: 'size-4 text-muted-foreground',
        'aria-hidden': true,
      })}
      <span className="sr-only">{t.types[type]}</span>
    </>
  )
}

export function QuestionsPage() {
  const [params, setParams] = useSearchParams()
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const { data: profile } = useGetCareerProfileQuery()
  const { data: track } = useGetTrackQuery()

  const rawStatus = params.get('status')
  const rawDifficulty = params.get('difficulty')
  const rawType = params.get('type')
  const status = STATUSES.find((s) => s === rawStatus)
  const difficulty = DIFFICULTIES.find((d) => d === rawDifficulty)
  const type = TYPES.find((value) => value === rawType)
  const competency = params.get('competency') ?? undefined
  const company = params.get('company') ?? undefined
  const levels = visibleLevels(profile?.seniority ?? 'JUNIOR')
  const level = levels.find((value) => value === params.get('level'))
  const page = Math.max(1, Math.floor(Number(params.get('page'))) || 1)

  const questions = useGetQuestionsQuery({
    page,
    size: PAGE_SIZE,
    type,
    status,
    difficulty,
    competency,
    company,
    level,
  })
  const { data, error, isFetching, refetch } = questions

  const companies: CompanyRef[] = profile?.companies.map(({ slug, name }) => ({ slug, name })) ?? []
  const competencies = track?.competencies ?? []

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries({ page: undefined, ...changes })) {
      if (value === undefined || value === ALL_FILTER) next.delete(key)
      else next.set(key, value)
    }
    setParams(next)
  }

  const competencyBelowTitle = (q: ProblemSummary) =>
    q.competency && (
      <span className="block text-xs font-normal text-muted-foreground md:hidden">
        {q.competency.name}
      </span>
    )

  const showLevel = levels.length > 1

  const levelBelowTitle = (q: ProblemSummary) =>
    showLevel && (
      <span className="mt-1 block sm:hidden">
        <LevelTag level={q.level} labelled />
      </span>
    )

  const levelColumn: Column<ProblemSummary> = {
    key: 'level',
    header: t.columns.level,
    headerClassName: 'hidden sm:table-cell',
    className: 'hidden sm:table-cell',
    cell: (q) => <LevelTag level={q.level} />,
  }

  const columns: Column<ProblemSummary>[] = [
    {
      key: 'status',
      header: <span className="sr-only">{t.columns.status}</span>,
      cell: (q) => <StatusIcon status={q.status} />,
      className: 'w-8',
    },
    {
      key: 'type',
      header: <span className="sr-only">{t.columns.type}</span>,
      cell: (q) => <TypeIcon type={q.type} />,
      className: 'w-8',
    },
    {
      key: 'title',
      header: t.columns.title,
      cell: (q) =>
        q.inExam ? (
          <span className="inline-block font-medium">
            <QuestionText text={q.title} inline />
            <span className="ml-2 rounded-md border border-dashed border-input px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              {t.inExam}
            </span>
            <span className="sr-only">{t.inExamHint}</span>
            {competencyBelowTitle(q)}
            {levelBelowTitle(q)}
          </span>
        ) : q.type === 'CHALLENGE' ? (
          <Link to={challengePath(q.slug)} className={cn(rowAction, 'inline-block')}>
            <QuestionText text={q.title} inline />
            {competencyBelowTitle(q)}
            {levelBelowTitle(q)}
          </Link>
        ) : (
          <button type="button" className={rowAction} onClick={() => setOpenSlug(q.slug)}>
            <QuestionText text={q.title} inline />
            {competencyBelowTitle(q)}
            {levelBelowTitle(q)}
          </button>
        ),
    },
    {
      key: 'competency',
      header: t.columns.competency,
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell',
      cell: (q) =>
        q.competency ? (
          <span className="inline-flex items-center gap-2">
            <CompetencyIcon category={q.competency.category} className="text-muted-foreground" />
            {q.competency.name}
          </span>
        ) : (
          <NoValue label={t.noCompetency} />
        ),
    },
    {
      key: 'difficulty',
      header: t.columns.difficulty,
      cell: (q) => <DifficultyLabel difficulty={q.difficulty} />,
    },
    ...(showLevel ? [levelColumn] : []),
    {
      key: 'acceptance',
      header: t.columns.acceptance,
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden sm:table-cell',
      cell: (q) =>
        q.acceptance === null ? (
          <NoValue label={t.noAcceptance} />
        ) : (
          <>
            <span className="font-mono text-xs" aria-hidden>
              {formatPercent(q.acceptance)}
            </span>
            <span className="sr-only">{t.acceptance(formatPercent(q.acceptance))}</span>
          </>
        ),
    },
    {
      key: 'askedBy',
      header: t.columns.askedBy,
      headerClassName: 'hidden lg:table-cell',
      className: 'hidden lg:table-cell',
      cell: (q) => <CompanyStack companies={companiesOf(q.askedBy, companies)} />,
    },
  ]

  const errorAlert = (
    <RetryAlert message={t.error} retrying={isFetching} onRetry={() => void refetch()} />
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{questionsTexts.title}</h1>
      {data ? (
        <Panel>
          {error && errorAlert}
          <StatusTabs<Tab>
            label={t.tabs.label}
            value={status ?? ALL_FILTER}
            onValueChange={(value) => update({ status: value })}
            busy={isFetching}
            panelRef={panel}
            items={[
              { value: ALL_FILTER, label: t.tabs.all, icon: Layers },
              { value: 'SOLVED', label: t.tabs.SOLVED, icon: CircleCheck },
              { value: 'ATTEMPTED', label: t.tabs.ATTEMPTED, icon: Contrast },
              { value: 'NOT_STARTED', label: t.tabs.NOT_STARTED, icon: CircleDashed },
            ]}
            actions={
              <>
                {isFetching && (
                  <p role="status" className="text-xs text-muted-foreground">
                    {t.updating}
                  </p>
                )}
                <FilterMenu
                  label={t.filters.type}
                  icon={Shapes}
                  value={type ?? ALL_FILTER}
                  onChange={(value) => update({ type: value })}
                  options={[
                    { value: ALL_FILTER, label: t.filters.allTypes },
                    ...TYPES.map((value) => ({ value, label: t.filters.types[value] })),
                  ]}
                />
                <FilterMenu
                  label={t.filters.difficulty}
                  icon={ListFilter}
                  value={difficulty ?? ALL_FILTER}
                  onChange={(value) => update({ difficulty: value })}
                  options={[
                    { value: ALL_FILTER, label: t.filters.all },
                    ...DIFFICULTIES.map((d: Difficulty) => ({
                      value: d,
                      label: appTexts.difficulty[d],
                    })),
                  ]}
                />
                {showLevel && (
                  <FilterMenu
                    label={t.filters.level}
                    icon={GraduationCap}
                    value={level ?? ALL_FILTER}
                    onChange={(value) => update({ level: value })}
                    options={[
                      { value: ALL_FILTER, label: t.filters.all },
                      ...levels.map((value: Level) => ({
                        value,
                        label: appTexts.levels[value],
                      })),
                    ]}
                  />
                )}
                <FilterMenu
                  label={t.filters.competency}
                  icon={Tag}
                  value={competency ?? ALL_FILTER}
                  onChange={(value) => update({ competency: value })}
                  options={[
                    { value: ALL_FILTER, label: t.filters.all },
                    ...competencies.map((c) => ({ value: c.slug, label: c.name })),
                  ]}
                />
                <FilterMenu
                  label={t.filters.company}
                  icon={Building2}
                  value={company ?? ALL_FILTER}
                  onChange={(value) => update({ company: value })}
                  options={[
                    { value: ALL_FILTER, label: t.filters.all },
                    ...companies.map((c) => ({ value: c.slug, label: c.name })),
                  ]}
                />
              </>
            }
          >
            <DataTable
              caption={t.caption}
              columns={columns}
              rows={data.items}
              rowKey={(q) => q.slug}
              empty={t.empty}
            />
          </StatusTabs>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(next) => update({ page: String(next) })}
          />
        </Panel>
      ) : error ? (
        errorAlert
      ) : (
        <Loading label={t.loading} className="space-y-3">
          <Skeleton className="h-8 w-80 max-w-full" />
          <TableSkeleton rows={8} />
        </Loading>
      )}
      <QuestionDialog
        slug={openSlug}
        onClose={() => setOpenSlug(null)}
        fallbackFocus={() => panel.current?.focus()}
      />
    </div>
  )
}
