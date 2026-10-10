import { http, HttpResponse } from 'msw'
import type { Progress } from '@/features/progress/types'
import type {
  AnswerResult,
  CompetencyRef,
  ProblemSummary,
  ProblemType,
  Question,
  QuestionPage,
} from '@/features/questions/types'
import { isoDate } from '@/lib/format'
import { visibleLevels, type Difficulty, type Level, type QuestionStatus } from '@/lib/learning'
import { checkProgressAchievements } from './achievements'
import { problem } from './problem'

const ESTRUTURAS: CompetencyRef = {
  slug: 'estruturas-de-dados-e-algoritmos',
  name: 'Estruturas de dados e algoritmos',
  category: 'fundamento',
}
const DESIGN: CompetencyRef = {
  slug: 'design-de-sistemas',
  name: 'Design de sistemas',
  category: 'fundamento',
}
const SQL: CompetencyRef = {
  slug: 'sql-e-modelagem-de-dados',
  name: 'SQL e modelagem de dados',
  category: 'fundamento',
}
const JAVA: CompetencyRef = { slug: 'java', name: 'Java', category: 'linguagem' }
const TESTES: CompetencyRef = {
  slug: 'testes-automatizados',
  name: 'Testes automatizados',
  category: 'pratica',
}
const APIS: CompetencyRef = { slug: 'apis-rest', name: 'APIs REST', category: 'pratica' }
const SEGURANCA: CompetencyRef = {
  slug: 'seguranca-de-aplicacoes',
  name: 'Segurança de aplicações',
  category: 'pratica',
}
const GIT: CompetencyRef = {
  slug: 'git-e-fluxo-de-codigo',
  name: 'Git e fluxo de código',
  category: 'pratica',
}

const BOTH = ['nubank', 'google']

export type PracticeQuestion = {
  statement: string
  options: string[]
  correct: number
  explanation: string
}

export type PracticeProblem = {
  slug: string
  type: ProblemType
  title: string
  competency: CompetencyRef | null
  difficulty: Difficulty
  level: Level
  askedBy: string[]
  question?: PracticeQuestion
}

const challenge = (slug: string, title: string, difficulty: Difficulty): PracticeProblem => ({
  slug,
  type: 'CHALLENGE',
  title,
  competency: ESTRUTURAS,
  difficulty,
  level: 'JUNIOR',
  askedBy: BOTH,
})

const question = (
  slug: string,
  title: string,
  competency: CompetencyRef,
  difficulty: Difficulty,
  askedBy: string[],
  body: PracticeQuestion,
  level: Level = 'JUNIOR',
): PracticeProblem => ({
  slug,
  type: 'QUESTION',
  title,
  competency,
  difficulty,
  level,
  askedBy,
  question: body,
})

export const PRACTICE_PROBLEMS: PracticeProblem[] = [
  challenge('valid-parentheses', 'Parênteses balanceados', 'EASY'),
  challenge('first-unique-char', 'Primeiro caractere único', 'EASY'),
  challenge('two-sum', 'Soma de dois números', 'EASY'),
  challenge('merge-sorted-arrays', 'Mesclar arrays ordenados', 'MEDIUM'),
  question(
    'backend-junior-java-equals-hashcode',
    'equals sem hashCode em HashMap',
    ESTRUTURAS,
    'HARD',
    BOTH,
    {
      statement:
        'Você sobrescreveu `equals` na classe `Cpf` para comparar pelo número, mas esqueceu de sobrescrever `hashCode`. O que tende a acontecer ao usar objetos `Cpf` como chave de um `HashMap`?',
      options: [
        'Nada muda, porque o `HashMap` compara as chaves apenas com `equals`',
        'O código deixa de compilar, porque `equals` e `hashCode` precisam vir juntos',
        'Buscas por um CPF igual podem falhar, porque cada objeto cai num balde diferente',
        'O `HashMap` lança uma exceção ao inserir uma segunda chave igual à primeira',
      ],
      correct: 2,
      explanation:
        'O `HashMap` usa primeiro o `hashCode` para escolher o balde e só depois compara com `equals` dentro dele.',
    },
  ),
  question(
    'backend-junior-spring-constructor-injection',
    'Injeção por construtor no Spring',
    DESIGN,
    'MEDIUM',
    BOTH,
    {
      statement:
        'Num projeto Spring, por que a injeção de dependências pelo construtor costuma ser preferida à injeção por campo com `@Autowired`?',
      options: [
        'Porque é a única forma de injeção que o Spring ainda suporta',
        'Porque deixa as dependências explícitas e facilita criar a classe em testes',
        'Porque dispensa anotar a classe com `@Service` ou `@Component`',
        'Porque faz o Spring criar uma instância nova da dependência a cada chamada',
      ],
      correct: 1,
      explanation:
        'Com o construtor, a classe não existe sem as dependências: elas ficam visíveis na assinatura, podem ser `final` e o teste unitário cria o objeto com `new`, passando dublês.',
    },
  ),
  question(
    'backend-senior-backfill-in-batches',
    'Preencher coluna nova sem travar a tabela',
    DESIGN,
    'MEDIUM',
    BOTH,
    {
      statement:
        'Uma tabela de 200 milhões de linhas ganhou uma coluna nova que precisa ser preenchida a partir de dados existentes, sem tirar o serviço do ar. A equipe discute como rodar o preenchimento. Qual abordagem preserva a disponibilidade do serviço?',
      options: [
        'Fazer lotes pequenos por faixa de chave primária, com transações curtas e pausas',
        'Rodar um único `UPDATE` na tabela inteira, fora do horário de pico',
        'Bloquear escritas na tabela durante o preenchimento, para evitar inconsistência',
        'Rodar um único `UPDATE` dentro de uma transação, para garantir atomicidade',
      ],
      correct: 0,
      explanation:
        'Lotes por faixa de chave mantêm as transações curtas: os bloqueios duram pouco, o log de transações não incha, a replicação acompanha e o preenchimento pode ser pausado ou retomado.',
    },
    'SENIOR',
  ),
  question(
    'backend-junior-sql-foreign-key',
    'Chave estrangeira inexistente no insert',
    SQL,
    'EASY',
    BOTH,
    {
      statement:
        'Na tabela `pedidos`, a coluna `cliente_id` referencia `clientes(id)` por meio de uma chave estrangeira. O que acontece ao tentar inserir um pedido com um `cliente_id` que não existe em `clientes`?',
      options: [
        'O banco rejeita a inserção por violar a integridade referencial',
        'O banco insere o pedido e cria um cliente vazio automaticamente',
        'O banco insere o pedido trocando o `cliente_id` por nulo',
        'A inserção funciona, porque a chave estrangeira só serve para acelerar joins',
      ],
      correct: 0,
      explanation:
        'A chave estrangeira é uma restrição: todo valor da coluna precisa existir na tabela referenciada, e o banco recusa a operação com erro de violação de chave estrangeira.',
    },
  ),
  question(
    'backend-junior-sql-inner-join',
    'Pedidos só com cliente cadastrado',
    SQL,
    'EASY',
    BOTH,
    {
      statement:
        'Considere as tabelas `pedidos` e `clientes`. Você quer listar apenas os pedidos que têm um cliente cadastrado, com o nome do cliente ao lado. Qual junção usar?',
      options: [
        'LEFT JOIN de pedidos com clientes',
        'INNER JOIN de pedidos com clientes',
        'CROSS JOIN, filtrando depois no WHERE',
        'UNION das duas tabelas',
      ],
      correct: 1,
      explanation:
        'INNER JOIN devolve só as linhas que casam nos dois lados, que é exatamente "pedidos que têm cliente".',
    },
  ),
  question('backend-junior-sql-index', 'Busca por email ficou lenta', SQL, 'MEDIUM', BOTH, {
    statement:
      'A consulta `SELECT * FROM usuarios WHERE email = ?` ficou lenta depois que a tabela passou de um milhão de linhas. Qual é a primeira medida mais indicada?',
    options: [
      'Trocar o `=` por `LIKE`, que é otimizado para textos',
      'Adicionar `ORDER BY email` para o banco achar a linha mais rápido',
      'Aumentar o pool de conexões da aplicação',
      'Criar um índice na coluna `email`',
    ],
    correct: 3,
    explanation:
      'Sem índice, o banco precisa ler a tabela inteira (varredura sequencial) para achar o e-mail.',
  }),
  question(
    'backend-pleno-transaction-isolation',
    'Leitura não repetível na transação',
    SQL,
    'MEDIUM',
    BOTH,
    {
      statement:
        'Dentro de uma mesma transação, você lê o saldo de uma conta duas vezes e recebe valores diferentes, porque outra transação confirmou uma atualização entre as duas leituras. Segundo o padrão SQL, qual é o menor nível de isolamento que impede essa anomalia (leitura não repetível)?',
      options: [
        'READ UNCOMMITTED, que bloqueia a leitura de dados ainda não confirmados',
        'READ COMMITTED, que garante enxergar apenas dados já confirmados',
        'REPEATABLE READ, que mantém a leitura estável durante a transação',
        'SERIALIZABLE, o único nível que impede essa anomalia',
      ],
      correct: 2,
      explanation:
        'No READ COMMITTED cada comando enxerga o que já foi confirmado até aquele momento, então a segunda leitura vê o valor novo.',
    },
    'PLENO',
  ),
  question(
    'backend-pleno-composite-index-order',
    'Ordem das colunas no índice composto',
    SQL,
    'MEDIUM',
    BOTH,
    {
      statement:
        "A consulta `SELECT * FROM pedidos WHERE status = 'PAGO' AND criado_em >= ? ORDER BY criado_em` roda o tempo todo e a tabela é grande. Qual índice atende melhor tanto o filtro quanto a ordenação?",
      options: [
        'Índice composto em `(status, criado_em)`',
        'Índice composto em `(criado_em, status)`',
        'Dois índices separados, um em `status` e outro em `criado_em`',
        'Um índice só em `status`, porque ele já elimina a maior parte das linhas',
      ],
      correct: 0,
      explanation:
        'Num índice composto, a igualdade vem primeiro e a faixa depois: com `(status, criado_em)` o banco vai direto ao grupo `PAGO`, percorre a faixa de datas e já encontra as linhas na ordem pedida, sem ordenar.',
    },
    'PLENO',
  ),
  question(
    'backend-junior-orm-n-plus-one',
    'Cem consultas para listar cem pedidos',
    SQL,
    'HARD',
    BOTH,
    {
      statement:
        'Uma tela lista 100 pedidos e mostra o nome do cliente de cada um. No log, você vê uma consulta para buscar os pedidos e mais 100 consultas, uma por cliente. Qual é o problema e a correção mais comum?',
      options: [
        'Deadlock; aumentar o tempo limite da transação no banco',
        'Falta de índice; criar um índice na coluna `pedidos.id`',
        'Problema N+1; buscar os clientes junto, com `JOIN FETCH`',
        'Cache frio; dar mais memória para o cache do ORM',
      ],
      correct: 2,
      explanation:
        'É o problema N+1: a consulta traz só os pedidos, e cada cliente é carregado depois por uma consulta separada.',
    },
  ),
  question(
    'backend-junior-java-checked-exceptions',
    'Exceção verificada ou não verificada',
    JAVA,
    'EASY',
    BOTH,
    {
      statement:
        'Em Java, qual é a diferença prática entre uma exceção verificada (checked), como `IOException`, e uma não verificada, como `IllegalArgumentException`?',
      options: [
        'As verificadas não podem ser capturadas com `catch`, só propagadas',
        'As não verificadas só acontecem em tempo de compilação, não em execução',
        'As verificadas são mais rápidas, porque o compilador já as conhece de antemão',
        'As verificadas precisam ser tratadas ou declaradas com `throws`; as outras, não',
      ],
      correct: 3,
      explanation:
        'A diferença é uma regra do compilador: quem chama um método que lança uma exceção verificada precisa capturá-la ou declará-la no `throws`.',
    },
  ),
  question(
    'backend-junior-unit-test-doubles',
    'Teste unitário do `CadastroService`',
    TESTES,
    'MEDIUM',
    BOTH,
    {
      statement:
        'Você quer escrever um teste unitário para `CadastroService`, que usa um `UsuarioRepository` para salvar no banco. Qual abordagem mantém o teste unitário?',
      options: [
        'Trocar o repositório por um dublê (fake ou mock) no teste',
        'Subir o banco real e a aplicação inteira antes de cada teste',
        'Testar só o repositório, já que o serviço apenas o chama',
        'Deixar o serviço sem teste e confiar nos testes manuais',
      ],
      correct: 0,
      explanation:
        'O teste unitário isola a unidade: com um dublê no lugar do repositório, o teste roda em milissegundos e verifica só as regras do serviço.',
    },
  ),
  question('backend-junior-http-idempotency', 'Idempotência dos métodos HTTP', APIS, 'EASY', BOTH, {
    statement:
      'Em uma API REST, qual destes métodos HTTP é idempotente por definição, ou seja, repetir a mesma requisição várias vezes deixa o servidor no mesmo estado que uma única chamada?',
    options: [
      'POST, porque cria recursos de forma controlada',
      'PUT, porque substitui o recurso inteiro pelo corpo enviado',
      'PATCH, porque aplica só a diferença',
      'Nenhum método HTTP é idempotente; isso depende da implementação',
    ],
    correct: 1,
    explanation:
      'PUT envia a representação completa do recurso; enviar a mesma representação dez vezes produz o mesmo estado final.',
  }),
  question('backend-junior-http-401-vs-403', '401 versus 403', APIS, 'MEDIUM', BOTH, {
    statement:
      'Um usuário autenticado, com um token válido, tenta acessar uma rota exclusiva de administradores sem ter esse papel. Qual status HTTP a API deve devolver?',
    options: [
      '401 Unauthorized, porque o acesso não foi autorizado',
      '400 Bad Request, porque a requisição não deveria ter sido feita',
      '403 Forbidden, porque a identidade é conhecida mas não tem permissão',
      '500 Internal Server Error, porque a autorização falhou no servidor',
    ],
    correct: 2,
    explanation:
      '403 é a resposta para "sei quem você é, mas você não pode fazer isso": repetir a requisição com o mesmo usuário não muda o resultado.',
  }),
  question(
    'backend-junior-password-hashing',
    'Armazenamento seguro de senhas',
    SEGURANCA,
    'MEDIUM',
    [],
    {
      statement:
        'Ao implementar o cadastro com senha, como a senha do usuário deve ser armazenada no banco de dados?',
      options: [
        'Em texto puro, numa coluna com acesso restrito',
        'Criptografada com AES, para poder ser recuperada se o usuário esquecer',
        'Com um hash SHA-256 simples, que é rápido de calcular',
        'Com um hash de algoritmo lento e com sal, como BCrypt ou Argon2',
      ],
      correct: 3,
      explanation:
        'Senha não deve ser recuperável: guarda-se um hash e, no login, compara-se o hash da senha digitada.',
    },
  ),
  question('backend-junior-git-revert', 'Commit com bug já na main', GIT, 'MEDIUM', [], {
    statement:
      'Um commit com bug já foi enviado para a branch `main`, que o time inteiro usa. Qual comando desfaz o efeito desse commit sem reescrever o histórico compartilhado?',
    options: [
      '`git reset --hard HEAD~1` seguido de `git push --force`',
      '`git revert` com o hash do commit',
      '`git checkout` com o hash do commit',
      '`git commit --amend` na `main`',
    ],
    correct: 1,
    explanation:
      '`git revert` cria um commit novo que aplica o inverso das mudanças, então o histórico só cresce e quem já baixou a `main` continua sincronizado.',
  }),
]

const XP: Record<Difficulty, number> = { EASY: 20, MEDIUM: 30, HARD: 40 }
const MINUTES: Record<Difficulty, number> = { EASY: 2, MEDIUM: 4, HARD: 6 }

const PAST_DAYS = [
  0, 2, 1, 0, 0, 1, 2, 0, 0, 3, 2, 0, 0, 0, 1, 2, 0, 1, 3, 0, 2, 0, 1, 3, 0, 0, 2, 0, 1, 2, 3, 1, 2,
  2,
]

const BEFORE_TODAY: Record<string, QuestionStatus> = {
  'backend-junior-sql-foreign-key': 'SOLVED',
  'backend-junior-sql-inner-join': 'SOLVED',
  'backend-junior-http-idempotency': 'SOLVED',
  'backend-junior-sql-index': 'ATTEMPTED',
}

const ACCEPTANCE: Record<string, number> = {
  'backend-junior-sql-foreign-key': 0.71,
  'backend-junior-sql-inner-join': 0.62,
  'backend-junior-http-idempotency': 0.8,
  'backend-junior-sql-index': 0.45,
}

type State = {
  xp: number
  today: number
  statuses: Map<string, QuestionStatus>
  exam: { sessionId: string; slugs: string[] } | null
  seniority: Level
}

const initial = (): State => ({
  xp: 1240,
  today: 0,
  statuses: new Map(Object.entries(BEFORE_TODAY)),
  exam: null,
  seniority: 'JUNIOR',
})

let state = initial()

export function resetPractice() {
  state = initial()
}

export function setPracticeSeniority(level: Level) {
  state.seniority = level
}

const visible = (item: PracticeProblem) => visibleLevels(state.seniority).includes(item.level)

export function practiceProblem(slug: string): PracticeProblem {
  const found = PRACTICE_PROBLEMS.find((item) => item.slug === slug)
  if (!found) throw new Error(`Problema desconhecido no backend de prática: ${slug}`)
  return found
}

export function practiceStatus(slug: string): QuestionStatus {
  return state.statuses.get(slug) ?? 'NOT_STARTED'
}

export function recordChallengeSubmission(slug: string, passed: boolean, xpGained: number) {
  const before = practiceStatus(slug)
  state.statuses.set(slug, passed || before === 'SOLVED' ? 'SOLVED' : 'ATTEMPTED')
  state.xp += xpGained
  state.today += 1
}

const optionId = (slug: string, index: number) => `${slug}-${index}`

export function optionOf(slug: string, which: 'correct' | 'wrong') {
  const body = practiceProblem(slug).question!
  const index =
    which === 'correct' ? body.correct : body.options.findIndex((_, i) => i !== body.correct)
  const text = body.options[index]
  return { id: optionId(slug, index), text, label: text.replaceAll('`', '') }
}

const statusOf = (item: PracticeProblem): QuestionStatus =>
  state.statuses.get(item.slug) ?? 'NOT_STARTED'

function summaryOf(item: PracticeProblem): ProblemSummary {
  return {
    slug: item.slug,
    type: item.type,
    title: item.title,
    competency: item.competency,
    difficulty: item.difficulty,
    level: item.level,
    status: statusOf(item),
    acceptance: ACCEPTANCE[item.slug] ?? null,
    askedBy: item.askedBy,
    inExam: examSessionOf(item.slug) !== null,
  }
}

export function practiceQuestion(slug: string): Question {
  const item = practiceProblem(slug)
  const body = item.question!
  return {
    slug: item.slug,
    title: item.title,
    competency: item.competency,
    difficulty: item.difficulty,
    level: item.level,
    status: statusOf(item),
    estimatedMinutes: MINUTES[item.difficulty],
    statement: body.statement,
    options: body.options.map((text, index) => ({ id: optionId(item.slug, index), text })),
    xp: XP[item.difficulty],
  }
}

function daily(): PracticeProblem {
  const inTrack = PRACTICE_PROBLEMS.filter(
    (item) => visible(item) && item.type === 'QUESTION' && item.askedBy.length > 0,
  )
  return inTrack.find((item) => BEFORE_TODAY[item.slug] !== 'SOLVED') ?? inTrack[0]
}

export function practiceProgress(today: Date = new Date()): Progress {
  const counts = [...PAST_DAYS, state.today]
  let streak = 0
  for (let i = state.today > 0 ? counts.length - 1 : counts.length - 2; counts[i] > 0; i -= 1) {
    streak += 1
  }
  return {
    xp: state.xp,
    streakDays: streak,
    dailyGoal: { done: Math.min(3, state.today), target: 3 },
    activity: counts.map((count, index) => ({
      date: isoDate(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - (counts.length - 1 - index),
        ),
      ),
      count,
    })),
  }
}

export function answerPractice(
  slug: string,
  chosen: string,
): Omit<AnswerResult, 'newAchievements'> | null {
  const item = practiceProblem(slug)
  const body = item.question!
  const index = body.options.findIndex((_, i) => optionId(item.slug, i) === chosen)
  if (index < 0) return null
  const correct = index === body.correct
  const before = statusOf(item)
  const xpGained = correct && before !== 'SOLVED' ? XP[item.difficulty] : 0
  state.statuses.set(item.slug, correct || before === 'SOLVED' ? 'SOLVED' : 'ATTEMPTED')
  state.xp += xpGained
  state.today += 1
  return {
    correct,
    correctOptionId: optionId(item.slug, body.correct),
    explanation: body.explanation,
    xpGained,
  }
}

export function markSolved(slug: string) {
  state.statuses.set(slug, 'SOLVED')
}

export function recordSimulation(xp: number) {
  state.xp += xp
  state.today += 1
}

export function lockExam(sessionId: string, slugs: string[]) {
  state.exam = { sessionId, slugs }
}

export function unlockExam() {
  state.exam = null
}

export function examSessionOf(slug: string): string | null {
  return state.exam?.slugs.includes(slug) ? state.exam.sessionId : null
}

const unauthorized = () => problem(401, 'Não autenticado', 'Token ausente.')
const notFound = (slug: string) =>
  problem(404, 'Não encontrado', `Questão não encontrada: ${slug}.`)
function inExam(sessionId: string) {
  return HttpResponse.json(
    {
      type: 'about:blank',
      title: 'Sessão em andamento',
      status: 409,
      detail: 'Esta questão está na sua simulação em andamento.',
      sessionId,
    },
    { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
  )
}
const findQuestion = (slug: string) =>
  PRACTICE_PROBLEMS.find((item) => item.slug === slug && item.question && visible(item))

export function practiceHandlers() {
  return [
    http.get('/api/v1/questions', ({ request }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const params = new URL(request.url).searchParams
      const filter = (key: string, value: string) => !params.get(key) || params.get(key) === value
      const matching = PRACTICE_PROBLEMS.filter(visible)
        .map(summaryOf)
        .filter(
          (item) =>
            filter('type', item.type) &&
            filter('status', item.status) &&
            filter('difficulty', item.difficulty) &&
            filter('level', item.level) &&
            filter('competency', item.competency?.slug ?? '') &&
            (!params.get('company') || item.askedBy.includes(params.get('company')!)),
        )
      const size = Math.min(50, Math.max(1, Number(params.get('size')) || 10))
      const totalPages = Math.max(1, Math.ceil(matching.length / size))
      const page = Math.min(totalPages, Math.max(1, Number(params.get('page')) || 1))
      const body: QuestionPage = {
        items: matching.slice((page - 1) * size, page * size),
        page,
        totalPages,
        totalItems: matching.length,
      }
      return HttpResponse.json(body)
    }),
    http.get('/api/v1/questions/daily', ({ request }) =>
      request.headers.get('Authorization')
        ? HttpResponse.json(practiceQuestion(daily().slug))
        : unauthorized(),
    ),
    http.get('/api/v1/questions/:slug', ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const slug = String(params.slug)
      if (!findQuestion(slug)) return notFound(slug)
      const exam = examSessionOf(slug)
      return exam ? inExam(exam) : HttpResponse.json(practiceQuestion(slug))
    }),
    http.post('/api/v1/questions/:slug/answer', async ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const slug = String(params.slug)
      if (!findQuestion(slug)) return notFound(slug)
      const exam = examSessionOf(slug)
      if (exam) return inExam(exam)
      const { optionId: chosen } = (await request.json()) as { optionId: string }
      const result = answerPractice(slug, chosen)
      if (!result) {
        return problem(422, 'Dados inválidos', 'A alternativa escolhida não é desta questão.')
      }
      const body: AnswerResult = {
        ...result,
        newAchievements: checkProgressAchievements(practiceProgress()),
      }
      return HttpResponse.json(body)
    }),
    http.get('/api/v1/me/progress', ({ request }) =>
      request.headers.get('Authorization') ? HttpResponse.json(practiceProgress()) : unauthorized(),
    ),
  ]
}
