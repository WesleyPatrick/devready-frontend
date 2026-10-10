import {
  Braces,
  Building2,
  Container,
  GraduationCap,
  LayoutTemplate,
  Medal,
  Rocket,
  Target,
  type LucideIcon,
} from 'lucide-react'
import type { Level } from '@/features/catalog/api'
import type { AreaSlug } from './types'

export const STEP_ICONS: readonly LucideIcon[] = [Building2, Braces, Target]

export const AREA_ICONS: Record<AreaSlug, LucideIcon> = {
  backend: Braces,
  frontend: LayoutTemplate,
  devops: Container,
}

export const SENIORITY_ICONS: Record<Level, LucideIcon> = {
  JUNIOR: GraduationCap,
  PLENO: Rocket,
  SENIOR: Medal,
}
