import type { ChallengeLanguage, MaterialType, Requirement } from './types'

export const trackTexts = {
  title: 'Sua trilha',
  loading: 'Carregando trilha…',
  error: 'Não foi possível carregar a trilha.',
  sidebar: 'Seu progresso',
  search: { label: 'Buscar competência', placeholder: 'Buscar competência' },
  goal: { title: 'Seu objetivo', edit: 'Editar objetivo' },
  plan: {
    title: (area: string, level: string) => `Plano para ${area} ${level.toLowerCase()}`,
    ring: (done: number, total: number) => `${done} de ${total} competências concluídas`,
    of: (total: number) => `de ${total}`,
    jobs: (n: string) => `${n} vagas analisadas`,
    missing: (names: string, area: string, count: number) =>
      count === 1
        ? `${names} ficou de fora: ainda não há trilha de ${area} para esta empresa.`
        : `${names} ficaram de fora: ainda não há trilha de ${area} para estas empresas.`,
  },
  empty: {
    title: (area: string) => `Ainda não há trilha de ${area} para as empresas escolhidas`,
    body: (names: string) =>
      `A base de vagas não tem trilha dessa área para ${names}. Troque as empresas ou a stack no seu objetivo.`,
  },
  requirement: {
    obrigatoria: 'Obrigatória',
    desejavel: 'Desejável',
  } satisfies Record<Requirement, string>,
  tabs: {
    label: 'Situação',
    all: 'Todas',
    IN_PROGRESS: 'Em andamento',
    NOT_STARTED: 'Não iniciadas',
  },
  filters: {
    difficulty: 'Dificuldade',
    company: 'Empresa',
    all: 'Todas',
  },
  query: (term: string) => `Buscando “${term}”`,
  clearQuery: 'Limpar busca',
  table: {
    caption: 'Competências da trilha',
    status: 'Situação',
    competency: 'Competência',
    category: 'Categoria',
    difficulty: 'Dificuldade',
    askedBy: 'Quem pede',
    frequency: 'Pedido em',
    open: (name: string) => `Abrir ${name}`,
    empty: 'Nenhuma competência com esses filtros.',
  },
  sheet: {
    loading: 'Carregando competência…',
    error: 'Não foi possível carregar a competência.',
    askedBy: 'Quem pede',
    materials: 'Para estudar',
    noMaterials: 'Nenhum material de estudo ligado a esta competência ainda.',
    newTab: '(abre em outra aba)',
    materialType: {
      documentacao: 'Documentação',
      livro: 'Livro',
      curso: 'Curso',
      artigo: 'Artigo',
      video: 'Vídeo',
    } satisfies Record<MaterialType, string>,
    materialLanguage: { pt: 'Português', en: 'Inglês' },
    free: 'Gratuito',
    paid: 'Pago',
    questions: 'Questões',
    noQuestions: 'Nenhuma questão do catálogo ligada a esta competência ainda.',
    challenges: 'Desafios de código',
    challengesNote: 'Abra um desafio para escrever o código e rodar contra os casos de teste.',
    noChallenges: 'Nenhum desafio de código ligado a esta competência ainda.',
    languages: {
      JAVA: 'Java',
      PYTHON: 'Python',
      JAVASCRIPT: 'JavaScript',
    } satisfies Record<ChallengeLanguage, string>,
    locked: 'Bloqueada',
    lockedQuestions: 'As questões abrem junto com a competência.',
    lockedChallenges: 'Os desafios abrem junto com a competência.',
    close: 'Fechar',
  },
  streak: {
    title: (days: number) => (days === 1 ? '1 dia seguido' : `${days} dias seguidos`),
    weekdays: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
    summary: (active: number, month: string) =>
      `Você praticou em ${active} ${active === 1 ? 'dia' : 'dias'} de ${month}.`,
    day: (date: string, count: number) =>
      count === 0
        ? `${date}: sem prática`
        : count === 1
          ? `${date}: 1 atividade`
          : `${date}: ${count} atividades`,
    goal: 'Meta do dia',
    goalValue: (done: number, target: number) => `${done} de ${target} questões hoje`,
    loading: 'Carregando sequência…',
  },
  daily: {
    title: 'Questão do dia',
    answer: (xp: number) => `Responder · +${xp} XP`,
    answered: 'Respondida',
    attempted: 'Tentada',
    review: 'Rever',
    minutes: (n: number) => `${n} min`,
    loading: 'Carregando questão do dia…',
  },
  achievements: {
    title: 'Conquistas',
    count: (unlocked: number, total: number) => `${unlocked} de ${total}`,
    item: (name: string, unlocked: boolean, description: string) =>
      `${name}, ${unlocked ? 'desbloqueada' : 'bloqueada'}: ${description}`,
    loading: 'Carregando conquistas…',
  },
} as const
