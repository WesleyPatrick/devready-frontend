import { http, HttpResponse } from 'msw'
import type {
  CaseResult,
  Challenge,
  ChallengeLanguage,
  Submission,
  SubmissionKind,
  SubmissionStatus,
  SubmissionSummary,
} from '@/features/challenge/types'
import { isFinal } from '@/features/challenge/status'
import { checkProgressAchievements } from './achievements'
import {
  examSessionOf,
  practiceProblem,
  practiceProgress,
  practiceStatus,
  recordChallengeSubmission,
} from './practice'
import { problem } from './problem'

export type Outcome = Exclude<SubmissionStatus, 'QUEUED' | 'RUNNING'>

const SLUG = 'two-sum'

export const TWO_SUM_STARTERS: Record<ChallengeLanguage, string> = {
  JAVA: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // sua solução\n        return new int[0];\n    }\n}\n',
  PYTHON: 'class Solution:\n    def two_sum(self, nums, target):\n        return []\n',
  JAVASCRIPT:
    'class Solution {\n  twoSum(nums, target) {\n    // sua solução\n    return [];\n  }\n}\n',
}

const CASES: Array<{ args: unknown[]; expected: unknown }> = [
  { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
  { args: [[3, 2, 4], 6], expected: [1, 2] },
  { args: [[3, 3], 6], expected: [0, 1] },
  { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
  { args: [[0, 4, 3, 0], 0], expected: [0, 3] },
  { args: [[1, 5, 9], 14], expected: [1, 2] },
]

const APPROACH =
  'A solução com dois laços testa todos os pares em O(n²). A esperada usa um mapa de valor para índice: ao visitar `nums[i]`, procure `target - nums[i]` no mapa; se estiver lá, os índices são o guardado e `i`; se não, guarde `nums[i]` com o índice `i`. Procurar antes de guardar evita usar o mesmo elemento duas vezes. Uma passada, O(n) de tempo e O(n) de memória.'

export const COMPILE_OUTPUT = "Main.java:4: error: ';' expected"
export const RUNTIME_MESSAGE = 'Exception in thread "main" java.lang.NullPointerException'

export function practiceChallenge(): Challenge {
  const item = practiceProblem(SLUG)
  const status = practiceStatus(SLUG)
  return {
    slug: SLUG,
    title: item.title,
    difficulty: item.difficulty,
    competency: item.competency,
    askedBy: item.askedBy,
    status,
    xp: 40,
    statement:
      'Dado um array de inteiros `nums` e um inteiro `target`, devolva os índices dos dois números cuja soma é igual a `target`.\n\nCada entrada tem exatamente uma solução, e o mesmo elemento não pode ser usado duas vezes (mas dois elementos diferentes podem ter o mesmo valor). A ordem dos dois índices na resposta não importa.\n\nExemplo: para `nums = [2, 7, 11, 15]` e `target = 9`, a resposta é `[0, 1]`, porque `2 + 7 = 9`.',
    languages: [
      {
        language: 'JAVA',
        runtime: 'Java 13',
        functionName: 'twoSum',
        starterCode: TWO_SUM_STARTERS.JAVA,
      },
      {
        language: 'PYTHON',
        runtime: 'Python 3.8',
        functionName: 'two_sum',
        starterCode: TWO_SUM_STARTERS.PYTHON,
      },
      {
        language: 'JAVASCRIPT',
        runtime: 'Node 12',
        functionName: 'twoSum',
        starterCode: TWO_SUM_STARTERS.JAVASCRIPT,
      },
    ],
    visibleCases: CASES.slice(0, 2).map((c, position) => ({ position, ...c })),
    hiddenCaseCount: 4,
    limits: { timeLimitMs: 5000, memoryLimitKb: 262144 },
    approachSummary: status === 'SOLVED' ? APPROACH : null,
  }
}

type Stored = { submission: Submission; outcome: Outcome }

type State = {
  submissions: Map<string, Stored>
  counter: number
  next: Outcome
  paused: boolean
}

const initial = (): State => ({ submissions: new Map(), counter: 0, next: 'PASSED', paused: false })

let state = initial()

export function resetChallenges() {
  state = initial()
}

export function nextOutcome(outcome: Outcome) {
  state.next = outcome
}

export function pauseSubmissions() {
  state.paused = true
}

export function resumeSubmissions() {
  state.paused = false
}

export function stepSubmissions() {
  let moved = 0
  for (const stored of state.submissions.values()) {
    if (isFinal(stored.submission.status)) continue
    advance(stored)
    moved += 1
  }
  return moved
}

function caseStatus(outcome: Outcome, index: number): CaseResult['status'] {
  if (outcome === 'PASSED') return 'PASSED'
  if (outcome === 'FAILED') return index === 1 || index === 3 ? 'FAILED' : 'PASSED'
  return index < 3 ? 'PASSED' : 'TIME_LIMIT'
}

function resultsFor(kind: SubmissionKind, outcome: Outcome): CaseResult[] {
  if (outcome !== 'PASSED' && outcome !== 'FAILED' && outcome !== 'TIME_LIMIT') return []
  const cases = kind === 'RUN' ? CASES.slice(0, 2) : CASES
  return cases.map((testCase, position) => {
    const status = caseStatus(outcome, position)
    const answered = status !== 'TIME_LIMIT'
    const visible = position < 2
    const base: CaseResult = { position, visible, status, ...(answered ? { timeMs: 2 } : {}) }
    if (!visible) return base
    return {
      ...base,
      args: testCase.args,
      expected: testCase.expected,
      ...(answered ? { actual: status === 'PASSED' ? testCase.expected : [] } : {}),
    }
  })
}

function finish({ submission, outcome }: Stored): Submission {
  const cases = resultsFor(submission.kind, outcome)
  const submit = submission.kind === 'SUBMIT'
  const xpGained =
    submit && outcome === 'PASSED' && practiceStatus(submission.challengeSlug) !== 'SOLVED' ? 40 : 0
  if (submit && outcome !== 'ERROR') {
    recordChallengeSubmission(submission.challengeSlug, outcome === 'PASSED', xpGained)
    checkProgressAchievements(practiceProgress())
  }
  return {
    ...submission,
    status: outcome,
    passedCount: cases.filter((c) => c.status === 'PASSED').length,
    compileOutput: outcome === 'COMPILE_ERROR' ? COMPILE_OUTPUT : null,
    errorMessage:
      outcome === 'RUNTIME_ERROR'
        ? RUNTIME_MESSAGE
        : outcome === 'ERROR'
          ? 'O executor de código não respondeu depois de quatro tentativas.'
          : null,
    xpGained,
    finishedAt: new Date().toISOString(),
    cases,
  }
}

function advance(stored: Stored) {
  if (stored.submission.status === 'QUEUED') {
    stored.submission = { ...stored.submission, status: 'RUNNING' }
  } else if (stored.submission.status === 'RUNNING') {
    stored.submission = finish(stored)
  }
}

const unauthorized = () => problem(401, 'Não autenticado', 'Token ausente.')
const notFound = (slug: string) =>
  problem(404, 'Não encontrado', `Desafio não encontrado: ${slug}.`)

function inExam(sessionId: string) {
  return HttpResponse.json(
    {
      type: 'about:blank',
      title: 'Sessão em andamento',
      status: 409,
      detail: 'Este desafio está na sua simulação em andamento.',
      sessionId,
    },
    { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

function create(kind: SubmissionKind) {
  return async ({ request, params }: { request: Request; params: Record<string, unknown> }) => {
    if (!request.headers.get('Authorization')) return unauthorized()
    const slug = String(params.slug)
    if (slug !== SLUG) return notFound(slug)
    const exam = examSessionOf(slug)
    if (exam) return inExam(exam)
    const body = (await request.json()) as { language?: ChallengeLanguage; sourceCode?: string }
    if (!body.language || !body.sourceCode?.trim()) {
      return problem(422, 'Dados inválidos', 'Confira os campos informados.', [
        { field: 'sourceCode', message: 'Escreva o código antes de rodar ou enviar.' },
      ])
    }
    state.counter += 1
    const id = `envio-${state.counter}`
    const submission: Submission = {
      id,
      challengeSlug: slug,
      kind,
      language: body.language,
      sourceCode: body.sourceCode,
      status: 'QUEUED',
      passedCount: 0,
      totalCount: kind === 'RUN' ? 2 : 6,
      compileOutput: null,
      errorMessage: null,
      xpGained: 0,
      createdAt: new Date(Date.now() + state.counter).toISOString(),
      finishedAt: null,
      cases: [],
      sealed: false,
    }
    state.submissions.set(id, { submission, outcome: state.next })
    state.next = 'PASSED'
    return HttpResponse.json({ id, status: 'QUEUED' }, { status: 202 })
  }
}

export function challengeHandlers() {
  return [
    http.get('/api/v1/challenges/:slug', ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const slug = String(params.slug)
      if (slug !== SLUG) return notFound(slug)
      const exam = examSessionOf(slug)
      return exam ? inExam(exam) : HttpResponse.json(practiceChallenge())
    }),
    http.post('/api/v1/challenges/:slug/runs', create('RUN')),
    http.post('/api/v1/challenges/:slug/submissions', create('SUBMIT')),
    http.get('/api/v1/challenges/:slug/submissions', ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      if (String(params.slug) !== SLUG) return notFound(String(params.slug))
      const exam = examSessionOf(String(params.slug))
      if (exam) return inExam(exam)
      const items: SubmissionSummary[] = [...state.submissions.values()]
        .map(({ submission }) => submission)
        .filter((s) => s.challengeSlug === String(params.slug) && s.kind === 'SUBMIT')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ id, language, status, passedCount, totalCount, createdAt }) => ({
          id,
          language,
          status,
          passedCount,
          totalCount,
          createdAt,
        }))
      return HttpResponse.json(items)
    }),
    http.get('/api/v1/submissions/:id', ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const stored = state.submissions.get(String(params.id))
      if (!stored) return problem(404, 'Não encontrado', 'Envio não encontrado.')
      if (!state.paused) advance(stored)
      return HttpResponse.json(stored.submission)
    }),
  ]
}
