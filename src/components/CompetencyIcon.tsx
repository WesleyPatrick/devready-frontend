import {
  Blocks,
  Braces,
  CircleDot,
  Code,
  Container,
  Database,
  FlaskConical,
  GitBranch,
  Layers,
  LayoutTemplate,
  Network,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  fundamento: Layers,
  linguagem: Code,
  framework: Blocks,
  pratica: Wrench,
  comportamental: Users,
  fundamentos: Layers,
  dados: Database,
  backend: Braces,
  frontend: LayoutTemplate,
  devops: Container,
  qualidade: FlaskConical,
  ferramentas: GitBranch,
  arquitetura: Network,
}

export function CompetencyIcon({ category, className }: { category: string; className?: string }) {
  const Icon = ICONS[category] ?? CircleDot
  return <Icon className={cn('size-4 shrink-0', className)} aria-hidden data-category={category} />
}
