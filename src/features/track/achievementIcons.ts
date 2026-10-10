import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCheck,
  CircleCheck,
  Database,
  Flame,
  Map,
  Target,
  Timer,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  check: CircleCheck,
  flame: Flame,
  zap: Zap,
  book: BookOpen,
  target: Target,
  'check-check': CheckCheck,
  database: Database,
  timer: Timer,
  map: Map,
  trophy: Trophy,
  calendar: CalendarDays,
}

export function achievementIcon(name: string): LucideIcon {
  return ICONS[name] ?? Award
}
