import type { Level } from '@/features/catalog/api'
import type { AreaSlug, CompanyGroup } from './types'

export const careerTexts = {
  groups: {
    'big-tech': 'Big techs globais',
    'tech-brasil': 'Techs brasileiras',
  } satisfies Record<CompanyGroup, string>,
  areas: { backend: 'Backend', frontend: 'Frontend', devops: 'DevOps' } satisfies Record<
    AreaSlug,
    string
  >,
  seniorities: { JUNIOR: 'Júnior', PLENO: 'Pleno', SENIOR: 'Sênior' } satisfies Record<
    Level,
    string
  >,
  seniorityHints: {
    JUNIOR:
      'Primeiro emprego ou até uns dois anos de experiência. A entrevista cobra fundamentos e lógica.',
    PLENO: 'Já entrega sozinho. A entrevista cobra decisões de projeto e profundidade na stack.',
    SENIOR: 'Lidera decisões técnicas. A entrevista cobra arquitetura, trade-offs e liderança.',
  } satisfies Record<Level, string>,
  summary: {
    title: 'Seu objetivo',
    companies: 'Empresas',
    stack: 'Stack',
    seniority: 'Senioridade',
    edit: 'Editar objetivo',
  },
  onboarding: {
    steps: ['Empresas', 'Stack', 'Senioridade'],
    stepsLabel: 'Passos do objetivo',
    companies: {
      title: 'Onde você gostaria de trabalhar?',
      body: 'Escolha até cinco empresas. A trilha vai juntar o que elas cobram, com mais peso no que todas pedem.',
      counter: (n: number) => `${n} de 5 escolhidas`,
      limit: 'Você já escolheu 5. Desmarque uma para trocar.',
      wholeGroup: 'Ainda não sei, quero todas deste grupo',
      wholeGroupOf: (group: string) => `Ainda não sei, quero todas deste grupo: ${group}`,
    },
    stack: {
      title: 'Com qual stack?',
      body: 'A tecnologia principal da vaga que você quer. Dá para trocar depois.',
    },
    seniority: {
      title: 'Para qual senioridade?',
      body: 'O nível da vaga, não o seu hoje. Se estiver em dúvida, comece por júnior.',
    },
    back: 'Voltar',
    next: 'Continuar',
    finish: 'Concluir',
    cancel: 'Cancelar',
    saving: 'Salvando…',
    loading: 'Carregando opções…',
    profileLoadError: 'Não foi possível carregar seu objetivo atual.',
    loadError: 'Não foi possível carregar as opções.',
  },
  guard: {
    loading: 'Carregando seu objetivo…',
    error: 'Não foi possível carregar seu objetivo de carreira.',
  },
} as const
