import type { CompanyGroup, CompanyOption } from './types'

export const MAX_COMPANIES = 5

export const GROUPS: CompanyGroup[] = ['big-tech', 'tech-brasil']

export function inScreenOrder(companies: CompanyOption[], selected: string[]) {
  return GROUPS.flatMap((group) =>
    companies
      .filter((company) => company.group === group && selected.includes(company.slug))
      .map((company) => company.slug),
  )
}
