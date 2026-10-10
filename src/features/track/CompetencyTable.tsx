import { useRef, useState } from 'react'
import {
  ArrowRight,
  Building2,
  CircleDashed,
  Contrast,
  Layers,
  ListFilter,
  Play,
  X,
} from 'lucide-react'
import { CompanyStack } from '@/components/CompanyMonogram'
import { CompetencyIcon } from '@/components/CompetencyIcon'
import { DataTable, type Column } from '@/components/DataTable'
import { DifficultyLabel } from '@/components/DifficultyLabel'
import { FilterMenu } from '@/components/FilterMenu'
import { FrequencyBar } from '@/components/FrequencyBar'
import { Panel } from '@/components/Panel'
import { StatusIcon } from '@/components/StatusIcon'
import { StatusTabs } from '@/components/StatusTabs'
import { Button } from '@/components/ui/button'
import { appTexts } from '@/app/texts'
import {
  ALL_FILTER,
  categoryLabel,
  companiesOf,
  DIFFICULTIES,
  type CompanyRef,
  type Difficulty,
} from '@/lib/learning'
import { rowAction } from '@/lib/rowAction'
import { cn } from '@/lib/utils'
import { RequirementTag } from './RequirementTag'
import { trackTexts } from './texts'
import type { Competency } from './types'

const t = trackTexts

type Tab = 'all' | 'IN_PROGRESS' | 'NOT_STARTED'

type Props = {
  competencies: Competency[]
  companies: CompanyRef[]
  query: string
  onClearQuery: () => void
  onOpen: (slug: string) => void
  cascade?: boolean
}

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export function CompetencyTable({
  competencies,
  companies,
  query,
  onClearQuery,
  onOpen,
  cascade,
}: Props) {
  const [tab, setTab] = useState<Tab>('all')
  const [difficulty, setDifficulty] = useState<string>(ALL_FILTER)
  const [company, setCompany] = useState<string>(ALL_FILTER)
  const panel = useRef<HTMLDivElement>(null)

  const term = plain(query.trim())
  const matching = competencies.filter(
    (c) =>
      (!term || plain(c.name).includes(term)) &&
      (difficulty === ALL_FILTER || c.difficulty === (difficulty as Difficulty)) &&
      (company === ALL_FILTER || c.askedBy.includes(company)),
  )
  const count = (status: Tab) =>
    status === 'all' ? matching.length : matching.filter((c) => c.status === status).length
  const rows = tab === 'all' ? matching : matching.filter((c) => c.status === tab)

  const columns: Column<Competency>[] = [
    {
      key: 'status',
      header: <span className="sr-only">{t.table.status}</span>,
      cell: (c) => <StatusIcon status={c.status} />,
      className: 'w-8',
    },
    {
      key: 'name',
      header: t.table.competency,
      cell: (c) => (
        <button
          type="button"
          aria-label={t.table.open(c.name)}
          aria-describedby={`requirement-${c.slug}`}
          onClick={() => onOpen(c.slug)}
          className={cn(rowAction, 'inline-flex w-full items-center gap-2 py-1')}
        >
          <CompetencyIcon category={c.category} className="text-muted-foreground" />
          <span className="min-w-0">{c.name}</span>
          <RequirementTag requirement={c.requirement} id={`requirement-${c.slug}`} />
          {c.status === 'IN_PROGRESS' ? (
            <Play className="ml-auto size-4 shrink-0 text-brand" aria-hidden />
          ) : (
            <ArrowRight className="ml-auto size-4 shrink-0" aria-hidden />
          )}
        </button>
      ),
    },
    {
      key: 'category',
      header: t.table.category,
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell',
      cell: (c) => (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
          {categoryLabel(c.category)}
        </span>
      ),
    },
    {
      key: 'difficulty',
      header: t.table.difficulty,
      cell: (c) =>
        c.status === 'LOCKED' ? (
          <span className="font-medium">{appTexts.difficulty[c.difficulty]}</span>
        ) : (
          <DifficultyLabel difficulty={c.difficulty} />
        ),
    },
    {
      key: 'askedBy',
      header: t.table.askedBy,
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden sm:table-cell',
      cell: (c) => <CompanyStack companies={companiesOf(c.askedBy, companies)} />,
    },
    {
      key: 'frequency',
      header: <span className="block text-right">{t.table.frequency}</span>,
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden text-right sm:table-cell',
      cell: (c) => <FrequencyBar jobs={c.frequency.jobs} total={c.frequency.total} />,
    },
  ]

  return (
    <Panel>
      <StatusTabs
        label={t.tabs.label}
        value={tab}
        onValueChange={setTab}
        panelRef={panel}
        items={[
          { value: 'all', label: t.tabs.all, icon: Layers, count: count('all') },
          {
            value: 'IN_PROGRESS',
            label: t.tabs.IN_PROGRESS,
            icon: Contrast,
            count: count('IN_PROGRESS'),
          },
          {
            value: 'NOT_STARTED',
            label: t.tabs.NOT_STARTED,
            icon: CircleDashed,
            count: count('NOT_STARTED'),
          },
        ]}
        actions={
          <>
            <FilterMenu
              label={t.filters.difficulty}
              icon={ListFilter}
              value={difficulty}
              onChange={setDifficulty}
              options={[
                { value: ALL_FILTER, label: t.filters.all },
                ...DIFFICULTIES.map((d) => ({ value: d, label: appTexts.difficulty[d] })),
              ]}
            />
            <FilterMenu
              label={t.filters.company}
              icon={Building2}
              value={company}
              onChange={setCompany}
              options={[
                { value: ALL_FILTER, label: t.filters.all },
                ...companies.map((c) => ({ value: c.slug, label: c.name })),
              ]}
            />
          </>
        }
      >
        {query && (
          <p className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{t.query(query)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClearQuery()
                panel.current?.focus()
              }}
            >
              <X aria-hidden />
              {t.clearQuery}
            </Button>
          </p>
        )}
        <DataTable
          caption={t.table.caption}
          columns={columns}
          rows={rows}
          rowKey={(c) => c.slug}
          rowClassName={(c) => (c.status === 'LOCKED' ? 'text-muted-foreground' : undefined)}
          empty={t.table.empty}
          animateRows={cascade}
        />
      </StatusTabs>
    </Panel>
  )
}
