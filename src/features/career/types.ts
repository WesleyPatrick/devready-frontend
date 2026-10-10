import type { Level } from '@/features/catalog/api'

export type CompanyGroup = 'big-tech' | 'tech-brasil'
export type AreaSlug = 'backend' | 'frontend' | 'devops'
export type CompanyOption = { slug: string; name: string; group: CompanyGroup }
export type StackOption = { slug: string; name: string; area: AreaSlug }
export type CareerOptions = {
  companies: CompanyOption[]
  stacks: StackOption[]
  seniorities: Level[]
}
export type CareerProfile = { companies: CompanyOption[]; stack: StackOption; seniority: Level }
export type SaveCareerProfileBody = { companies: string[]; stack: string; seniority: Level }
