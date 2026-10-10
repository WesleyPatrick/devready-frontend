import { Braces, Container, LayoutTemplate, type LucideIcon } from 'lucide-react'

const AREA_ICONS: Record<string, LucideIcon> = {
  backend: Braces,
  frontend: LayoutTemplate,
  devops: Container,
}

export function areaIcon(slug: string): LucideIcon {
  return AREA_ICONS[slug] ?? Braces
}
