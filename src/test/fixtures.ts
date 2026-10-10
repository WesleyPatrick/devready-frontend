import type { AuthTokensResponse, CurrentUser } from '@/features/auth/types'
import type { Area } from '@/features/catalog/api'
import type { CareerOptions, CareerProfile } from '@/features/career/types'
import type {
  ChallengeLanguage,
  Competency,
  CompetencyCategory,
  CompetencyDetail,
  Requirement,
  Track,
} from '@/features/track/types'
import type { CompetencyStatus, Difficulty } from '@/lib/learning'

export const candidate: CurrentUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'ana@example.com',
  displayName: 'Ana',
  avatarUrl: null,
  role: 'CANDIDATE',
  hasPassword: true,
  providers: [],
  mustChangePassword: false,
}

export const admin: CurrentUser = {
  id: '22222222-2222-2222-2222-222222222222',
  email: 'admin@devready.local',
  displayName: 'Administrador',
  avatarUrl: null,
  role: 'ADMIN',
  hasPassword: true,
  providers: [],
  mustChangePassword: false,
}

export const tokens: AuthTokensResponse = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresIn: 900,
  tokenType: 'Bearer',
  user: candidate,
}

export const areas: Area[] = [
  {
    slug: 'backend',
    name: 'Backend',
    questionCount: 8,
    challengeCount: 2,
    durationMinutes: 45,
    objectiveWeight: 0.5,
    levels: ['JUNIOR', 'PLENO', 'SENIOR'],
  },
  {
    slug: 'devops',
    name: 'DevOps',
    questionCount: 10,
    challengeCount: 1,
    durationMinutes: 40,
    objectiveWeight: 0.7,
    levels: ['JUNIOR', 'PLENO', 'SENIOR'],
  },
  {
    slug: 'frontend',
    name: 'Frontend',
    questionCount: 8,
    challengeCount: 2,
    durationMinutes: 45,
    objectiveWeight: 0.5,
    levels: ['JUNIOR', 'PLENO', 'SENIOR'],
  },
]

export const careerOptions: CareerOptions = {
  companies: [
    { slug: 'amazon', name: 'Amazon', group: 'big-tech' },
    { slug: 'apple', name: 'Apple', group: 'big-tech' },
    { slug: 'google', name: 'Google', group: 'big-tech' },
    { slug: 'meta', name: 'Meta', group: 'big-tech' },
    { slug: 'microsoft', name: 'Microsoft', group: 'big-tech' },
    { slug: 'ifood', name: 'iFood', group: 'tech-brasil' },
    { slug: 'mercado-livre', name: 'Mercado Livre', group: 'tech-brasil' },
    { slug: 'nubank', name: 'Nubank', group: 'tech-brasil' },
    { slug: 'picpay', name: 'PicPay', group: 'tech-brasil' },
    { slug: 'stone', name: 'Stone', group: 'tech-brasil' },
  ],
  stacks: [
    { slug: 'dotnet', name: '.NET e C#', area: 'backend' },
    { slug: 'go', name: 'Go', area: 'backend' },
    { slug: 'java-spring', name: 'Java e Spring', area: 'backend' },
    { slug: 'node', name: 'Node.js', area: 'backend' },
    { slug: 'python', name: 'Python', area: 'backend' },
    { slug: 'kubernetes-cloud', name: 'Kubernetes e nuvem', area: 'devops' },
    { slug: 'angular-vue', name: 'Angular ou Vue', area: 'frontend' },
    { slug: 'react', name: 'React', area: 'frontend' },
  ],
  seniorities: ['JUNIOR', 'PLENO', 'SENIOR'],
}

export const careerProfile: CareerProfile = {
  companies: [
    { slug: 'nubank', name: 'Nubank', group: 'tech-brasil' },
    { slug: 'google', name: 'Google', group: 'big-tech' },
  ],
  stack: { slug: 'java-spring', name: 'Java e Spring', area: 'backend' },
  seniority: 'JUNIOR',
}

function item(
  slug: string,
  name: string,
  category: CompetencyCategory,
  difficulty: Difficulty,
  requirement: Requirement,
  askedBy: string[],
  jobs: number,
): Competency {
  return {
    slug,
    name,
    category,
    difficulty,
    status: 'NOT_STARTED',
    requirement,
    askedBy,
    frequency: { jobs, total: 26 },
  }
}

const BOTH = ['nubank', 'google']

export const track: Track = {
  plan: {
    totalCompetencies: 13,
    doneCompetencies: 0,
    byDifficulty: {
      EASY: { done: 0, total: 3 },
      MEDIUM: { done: 0, total: 8 },
      HARD: { done: 0, total: 2 },
    },
    jobsAnalyzed: 26,
    missingCompanies: [],
  },
  competencies: [
    item(
      'estruturas-de-dados-e-algoritmos',
      'Estruturas de dados e algoritmos',
      'fundamento',
      'MEDIUM',
      'obrigatoria',
      BOTH,
      18,
    ),
    item('design-de-sistemas', 'Design de sistemas', 'fundamento', 'HARD', 'obrigatoria', BOTH, 17),
    item(
      'sql-e-modelagem-de-dados',
      'SQL e modelagem de dados',
      'fundamento',
      'MEDIUM',
      'obrigatoria',
      BOTH,
      11,
    ),
    item('java', 'Java', 'linguagem', 'MEDIUM', 'obrigatoria', BOTH, 13),
    item('kotlin', 'Kotlin', 'linguagem', 'MEDIUM', 'obrigatoria', ['nubank'], 8),
    item('spring', 'Spring', 'framework', 'MEDIUM', 'obrigatoria', ['google'], 5),
    item(
      'testes-automatizados',
      'Testes automatizados',
      'pratica',
      'EASY',
      'obrigatoria',
      BOTH,
      13,
    ),
    item('apis-rest', 'APIs REST', 'pratica', 'EASY', 'obrigatoria', BOTH, 10),
    item(
      'mensageria-e-processamento-assincrono',
      'Mensageria e processamento assíncrono',
      'pratica',
      'HARD',
      'obrigatoria',
      ['nubank'],
      9,
    ),
    item('nuvem', 'Nuvem', 'pratica', 'MEDIUM', 'desejavel', BOTH, 7),
    item('observabilidade', 'Observabilidade', 'pratica', 'MEDIUM', 'desejavel', ['nubank'], 5),
    item(
      'comunicacao-e-trabalho-em-equipe',
      'Comunicação e trabalho em equipe',
      'comportamental',
      'EASY',
      'obrigatoria',
      BOTH,
      10,
    ),
    item('ingles', 'Inglês', 'comportamental', 'MEDIUM', 'obrigatoria', ['nubank'], 10),
  ],
}

const PROGRESS: Record<string, CompetencyStatus> = {
  'estruturas-de-dados-e-algoritmos': 'DONE',
  'sql-e-modelagem-de-dados': 'IN_PROGRESS',
  'design-de-sistemas': 'LOCKED',
}

export const trackWithProgress: Track = {
  plan: {
    ...track.plan,
    doneCompetencies: 1,
    byDifficulty: { ...track.plan.byDifficulty, MEDIUM: { done: 1, total: 8 } },
  },
  competencies: track.competencies.map((c) => ({ ...c, status: PROGRESS[c.slug] ?? c.status })),
}

export const emptyTrack: Track = {
  plan: {
    totalCompetencies: 0,
    doneCompetencies: 0,
    byDifficulty: {
      EASY: { done: 0, total: 0 },
      MEDIUM: { done: 0, total: 0 },
      HARD: { done: 0, total: 0 },
    },
    jobsAnalyzed: 0,
    missingCompanies: [
      { slug: 'nubank', name: 'Nubank' },
      { slug: 'google', name: 'Google' },
    ],
  },
  competencies: [],
}

const SUMMARIES: Record<string, string> = {
  'estruturas-de-dados-e-algoritmos':
    'Listas, mapas, pilhas, árvores e grafos, com o custo de cada operação. É a base dos testes de código das entrevistas, do teste online à conversa com o time.',
  'design-de-sistemas':
    'Escala, cache, filas, particionamento e consistência. É a conversa de quadro branco das entrevistas de pleno para cima.',
  'sql-e-modelagem-de-dados':
    'Consultas com junção e agregação, índices, transações e como modelar tabelas para o que a aplicação precisa ler e gravar.',
  java: 'A linguagem e a biblioteca padrão: coleções, exceções, igualdade, imutabilidade e o básico de concorrência.',
  kotlin:
    'A linguagem da JVM com nulos no sistema de tipos, data classes e corrotinas, comum em times que vieram do Java.',
  spring:
    'Injeção de dependência, Spring Boot, acesso a dados com JPA e transações: o framework mais pedido para Java no backend.',
  'testes-automatizados':
    'Testes de unidade e de integração, dublês de teste e como um teste prova que pega o erro que diz pegar.',
  'apis-rest':
    'Métodos, status, idempotência e como desenhar recursos HTTP que outro time consegue usar sem perguntar.',
  'mensageria-e-processamento-assincrono':
    'Filas e eventos para separar quem produz de quem consome, com reentrega, ordem e mensagem duplicada no meio do caminho.',
  nuvem:
    'Os serviços básicos de um provedor (computação, armazenamento, rede, filas) e o que muda quando a infraestrutura é alugada por uso.',
  observabilidade:
    'Logs, métricas e traces para saber o que o sistema está fazendo, e alertas que avisam antes de o usuário reclamar.',
  'comunicacao-e-trabalho-em-equipe':
    'Explicar uma decisão técnica, dar e receber revisão e contar uma situação real na entrevista comportamental.',
  ingles:
    'Ler documentação, escrever num pull request e conversar numa entrevista em inglês, como as big techs costumam fazer.',
}

const ALL_LANGUAGES: ChallengeLanguage[] = ['JAVA', 'PYTHON', 'JAVASCRIPT']

type DetailItems = {
  materials: CompetencyDetail['materials']
  questions: Array<Omit<CompetencyDetail['questions'][number], 'level'>>
  challenges: Array<Omit<CompetencyDetail['challenges'][number], 'level'>>
}

const DETAILS: Record<string, DetailItems> = {
  'estruturas-de-dados-e-algoritmos': {
    materials: [
      {
        title: 'Projeto de Algoritmos, de Paulo Feofiloff',
        url: 'https://www.ime.usp.br/~pf/algoritmos/',
        type: 'livro',
        language: 'pt',
        free: true,
      },
      {
        title: 'Introduction to Algorithms (MIT 6.006)',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        type: 'curso',
        language: 'en',
        free: true,
      },
      {
        title: 'NeetCode Roadmap',
        url: 'https://neetcode.io/roadmap',
        type: 'curso',
        language: 'en',
        free: true,
      },
    ],
    questions: [
      {
        slug: 'backend-junior-java-equals-hashcode',
        title: 'equals sem hashCode em HashMap',
        difficulty: 'HARD',
        status: 'NOT_STARTED',
      },
    ],
    challenges: [
      {
        slug: 'valid-parentheses',
        title: 'Parênteses balanceados',
        difficulty: 'EASY',
        languages: ALL_LANGUAGES,
        status: 'NOT_STARTED',
      },
      {
        slug: 'first-unique-char',
        title: 'Primeiro caractere único',
        difficulty: 'EASY',
        languages: ALL_LANGUAGES,
        status: 'NOT_STARTED',
      },
      {
        slug: 'two-sum',
        title: 'Soma de dois números',
        difficulty: 'EASY',
        languages: ALL_LANGUAGES,
        status: 'NOT_STARTED',
      },
      {
        slug: 'merge-sorted-arrays',
        title: 'Mesclar arrays ordenados',
        difficulty: 'MEDIUM',
        languages: ALL_LANGUAGES,
        status: 'NOT_STARTED',
      },
    ],
  },
  'sql-e-modelagem-de-dados': {
    materials: [
      {
        title: 'Use The Index, Luke',
        url: 'https://use-the-index-luke.com/sql/table-of-contents',
        type: 'livro',
        language: 'en',
        free: true,
      },
      {
        title: 'PostgreSQL Tutorial: The SQL Language',
        url: 'https://www.postgresql.org/docs/current/tutorial-sql.html',
        type: 'documentacao',
        language: 'en',
        free: true,
      },
    ],
    questions: [
      {
        slug: 'backend-junior-sql-foreign-key',
        title: 'Chave estrangeira inexistente no insert',
        difficulty: 'EASY',
        status: 'NOT_STARTED',
      },
      {
        slug: 'backend-junior-sql-inner-join',
        title: 'Pedidos só com cliente cadastrado',
        difficulty: 'EASY',
        status: 'NOT_STARTED',
      },
      {
        slug: 'backend-junior-sql-index',
        title: 'Busca por email ficou lenta',
        difficulty: 'MEDIUM',
        status: 'NOT_STARTED',
      },
      {
        slug: 'backend-junior-orm-n-plus-one',
        title: 'Cem consultas para listar cem pedidos',
        difficulty: 'HARD',
        status: 'NOT_STARTED',
      },
    ],
    challenges: [],
  },
  'apis-rest': {
    materials: [
      {
        title: 'HTTP (MDN)',
        url: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP',
        type: 'documentacao',
        language: 'pt',
        free: true,
      },
      {
        title: 'Boas práticas de design de API web',
        url: 'https://learn.microsoft.com/pt-br/azure/architecture/best-practices/api-design',
        type: 'artigo',
        language: 'pt',
        free: true,
      },
      {
        title: 'RFC 9110: HTTP Semantics',
        url: 'https://www.rfc-editor.org/rfc/rfc9110.html',
        type: 'documentacao',
        language: 'en',
        free: true,
      },
    ],
    questions: [
      {
        slug: 'backend-junior-http-idempotency',
        title: 'Idempotência dos métodos HTTP',
        difficulty: 'EASY',
        status: 'NOT_STARTED',
      },
      {
        slug: 'backend-junior-http-401-vs-403',
        title: '401 versus 403',
        difficulty: 'MEDIUM',
        status: 'NOT_STARTED',
      },
    ],
    challenges: [],
  },
  'design-de-sistemas': {
    materials: [
      {
        title: 'The System Design Primer',
        url: 'https://github.com/donnemartin/system-design-primer',
        type: 'artigo',
        language: 'en',
        free: true,
      },
      {
        title: 'System Design (Tech Interview Handbook)',
        url: 'https://www.techinterviewhandbook.org/system-design/',
        type: 'artigo',
        language: 'en',
        free: true,
      },
      {
        title: 'Designing Data-Intensive Applications',
        url: 'https://dataintensive.net/',
        type: 'livro',
        language: 'en',
        free: false,
      },
    ],
    questions: [
      {
        slug: 'backend-junior-spring-constructor-injection',
        title: 'Injeção por construtor no Spring',
        difficulty: 'MEDIUM',
        status: 'NOT_STARTED',
      },
    ],
    challenges: [],
  },
}

export function competencyDetail(slug: string, from: Track = track): CompetencyDetail | null {
  const competency = from.competencies.find((c) => c.slug === slug)
  if (!competency) return null
  return {
    ...competency,
    description: SUMMARIES[slug] ?? '',
    lockedReason:
      competency.status === 'LOCKED'
        ? 'Abre quando você concluir Estruturas de dados e algoritmos.'
        : null,
    materials: DETAILS[slug]?.materials ?? [],
    questions: (DETAILS[slug]?.questions ?? []).map((q) => ({ ...q, level: 'JUNIOR' as const })),
    challenges: (DETAILS[slug]?.challenges ?? []).map((c) => ({
      ...c,
      level: 'JUNIOR' as const,
    })),
  }
}
