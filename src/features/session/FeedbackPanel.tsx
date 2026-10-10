import { Link } from 'react-router'
import { ThumbsUp, TrendingDown } from 'lucide-react'
import { paths } from '@/app/paths'
import { Panel } from '@/components/Panel'
import { sessionTexts } from './texts'
import type { CompetencyResult } from './types'

const t = sessionTexts.result

function Item({ item }: { item: CompetencyResult }) {
  return (
    <li className="space-y-1 text-sm">
      <p>{item.text}</p>
      {item.competency && (
        <Link
          to={`${paths.track}?q=${encodeURIComponent(item.competency.name)}`}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          {t.study}
          <span className="sr-only">{t.studyOf(item.competency.name)}</span>
        </Link>
      )}
    </li>
  )
}

export function FeedbackPanel({ competencies }: { competencies: CompetencyResult[] }) {
  const strong = competencies.filter((c) => c.verdict === 'STRONG')
  const gaps = competencies.filter((c) => c.verdict === 'GAP')
  const middle = competencies.filter((c) => c.verdict === 'OK')
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Panel title={t.strengths} icon={ThumbsUp} iconClassName="text-easy">
          {strong.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noStrengths}</p>
          ) : (
            <ul role="list" className="m-0 list-none space-y-3 p-0">
              {strong.map((item) => (
                <Item key={item.competency?.slug ?? 'outros'} item={item} />
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={t.gaps} icon={TrendingDown} iconClassName="text-hard">
          {gaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noGaps}</p>
          ) : (
            <ul role="list" className="m-0 list-none space-y-3 p-0">
              {gaps.map((item) => (
                <Item key={item.competency?.slug ?? 'outros'} item={item} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
      {middle.length > 0 && (
        <Panel title={t.middle}>
          <ul role="list" className="m-0 list-none space-y-3 p-0">
            {middle.map((item) => (
              <Item key={item.competency?.slug ?? 'outros'} item={item} />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}
