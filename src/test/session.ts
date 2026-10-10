import { http, HttpResponse } from 'msw'
import type {
  CaseResult,
  ChallengeLanguage,
  Submission,
  SubmissionKind,
} from '@/features/challenge/types'
import { isFinal } from '@/features/challenge/status'
import type {
  CompetencyResult,
  Session,
  SessionAnswer,
  SessionChallenge,
  SessionResult,
  SessionSummary,
} from '@/features/session/types'
import { LEVELS, type Level } from '@/lib/learning'
import { checkProgressAchievements, unlockAchievement } from './achievements'
import { practiceChallenge } from './challenge'
import { competencyDetail } from './fixtures'
import {
  answerPractice,
  lockExam,
  markSolved,
  PRACTICE_PROBLEMS,
  practiceProblem,
  practiceProgress,
  practiceQuestion,
  recordSimulation,
  unlockExam,
} from './practice'
import { problem } from './problem'

type Outcome = 'PASSED' | 'FAILED'
type Stored = { session: Session; correct: Map<number, boolean>; newAchievements: string[] }
type StoredSubmission = { submission: Submission; sessionId: string; outcome: Outcome }
type State = {
  sessions: Map<string, Stored>
  submissions: Map<string, StoredSubmission>
  counter: number
  paused: boolean
  next: Outcome
}

export const SIMULATION_QUESTIONS = PRACTICE_PROBLEMS.filter(
  (p) => p.type === 'QUESTION' && p.level === 'JUNIOR',
)
  .slice(0, 8)
  .map((p) => p.slug)

const PARENTHESES: Omit<
  SessionChallenge,
  'position' | 'submissionsUsed' | 'submissionsLeft' | 'bestSubmissionId' | 'lastSubmissionId'
> = {
  slug: 'valid-parentheses',
  title: 'Parênteses balanceados',
  difficulty: 'EASY',
  statement: 'Dada uma string com `()[]{}`, diga se os parênteses estão balanceados.',
  languages: [
    {
      language: 'JAVA',
      runtime: 'Java 13',
      functionName: 'isValid',
      starterCode:
        'class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}\n',
    },
  ],
  visibleCases: [
    { position: 0, args: ['()'], expected: true },
    { position: 1, args: ['(]'], expected: false },
  ],
  limits: { timeLimitMs: 5000, memoryLimitKb: 262144 },
}

const TOTAL_CASES: Record<string, number> = { 'two-sum': 6, 'valid-parentheses': 4 }

const initial = (): State => ({
  sessions: new Map(),
  submissions: new Map(),
  counter: 0,
  paused: false,
  next: 'PASSED',
})

let state = initial()

const LEVEL_NAMES: Record<string, string> = { JUNIOR: 'júnior', PLENO: 'pleno', SENIOR: 'sênior' }

export function resetSessions() {
  state = initial()
}

export function pauseSessionSubmissions() {
  state.paused = true
}

export function resumeSessionSubmissions() {
  state.paused = false
}

export function nextSessionOutcome(outcome: Outcome) {
  state.next = outcome
}

function questionOf(slug: string, position: number) {
  const q = practiceQuestion(slug)
  return {
    position,
    slug: q.slug,
    title: q.title,
    difficulty: q.difficulty,
    statement: q.statement,
    options: q.options,
    chosenOptionId: null,
  }
}

function challengesOf(): SessionChallenge[] {
  const twoSum = practiceChallenge()
  const base = [
    {
      slug: twoSum.slug,
      title: twoSum.title,
      difficulty: twoSum.difficulty,
      statement: twoSum.statement,
      languages: twoSum.languages,
      visibleCases: twoSum.visibleCases,
      limits: twoSum.limits,
    },
    PARENTHESES,
  ]
  return base.map((c, i) => ({
    ...c,
    position: i + 1,
    submissionsUsed: 0,
    submissionsLeft: 5,
    bestSubmissionId: null,
    lastSubmissionId: null,
  }))
}

function create(session: Omit<Session, 'id'>): Session {
  state.counter += 1
  const created: Session = { ...session, id: `sessao-${state.counter}` }
  state.sessions.set(created.id, { session: created, correct: new Map(), newAchievements: [] })
  return created
}

export function openSimulation(options: { deadlineAt?: Date; level?: Level } = {}): Session {
  const now = new Date()
  const session = create({
    format: 'SIMULATION',
    status: 'IN_PROGRESS',
    area: { slug: 'backend', name: 'Backend' },
    level: options.level ?? 'JUNIOR',
    competency: null,
    startedAt: now.toISOString(),
    deadlineAt: (options.deadlineAt ?? new Date(now.getTime() + 45 * 60_000)).toISOString(),
    questions: SIMULATION_QUESTIONS.map((slug, i) => questionOf(slug, i + 1)),
    challenges: challengesOf(),
  })
  lockExam(session.id, ['two-sum', 'valid-parentheses', ...SIMULATION_QUESTIONS])
  return session
}

export function failSession(id: string) {
  stored(id)!.session.status = 'FAILED'
  unlockExam()
}

function lessonOf(competency: string): Session | null {
  const detail = competencyDetail(competency)
  if (!detail) return null
  const slugs = detail.questions
    .map((q) => q.slug)
    .filter((slug) => PRACTICE_PROBLEMS.some((p) => p.slug === slug && p.question))
    .slice(0, 8)
  if (slugs.length < 3) return null
  return create({
    format: 'LESSON',
    status: 'IN_PROGRESS',
    area: { slug: 'backend', name: 'Backend' },
    level: 'JUNIOR',
    competency: { slug: detail.slug, name: detail.name, category: detail.category },
    startedAt: new Date().toISOString(),
    deadlineAt: null,
    questions: slugs.map((slug, i) => questionOf(slug, i + 1)),
    challenges: [],
  })
}

export function openLesson(): Session {
  return lessonOf('sql-e-modelagem-de-dados')!
}

function stored(id: string) {
  return state.sessions.get(id)
}

export function sessionSnapshot(id: string): Session {
  return viewOf(stored(id)!)
}

function viewOf({ session, correct }: Stored): Session {
  const view = structuredClone(session)
  for (const c of view.challenges) c.bestSubmissionId = best(session.id, c.slug)?.id ?? null
  for (const q of view.questions) {
    const reveal =
      session.status === 'COMPLETED' || (session.format === 'LESSON' && q.chosenOptionId !== null)
    if (reveal) {
      const body = practiceProblem(q.slug).question!
      q.correct = correct.get(q.position) ?? false
      q.correctOptionId = practiceQuestion(q.slug).options[body.correct].id
      q.explanation = body.explanation
    }
  }
  return view
}

function open(): Stored | undefined {
  return [...state.sessions.values()].find((s) => s.session.status === 'IN_PROGRESS')
}

function pending(sessionId: string) {
  return [...state.submissions.values()].filter(
    (s) =>
      s.sessionId === sessionId && s.submission.kind === 'SUBMIT' && !isFinal(s.submission.status),
  )
}

function caseResults(kind: SubmissionKind, slug: string, outcome: Outcome): CaseResult[] {
  const total = kind === 'RUN' ? 2 : TOTAL_CASES[slug]
  return Array.from({ length: total }, (_, position) => ({
    position,
    visible: position < 2,
    status: outcome === 'PASSED' || position % 2 === 0 ? 'PASSED' : 'FAILED',
    timeMs: 2,
  }))
}

function advance(entry: StoredSubmission) {
  const s = entry.submission
  if (s.status === 'QUEUED') {
    entry.submission = { ...s, status: 'RUNNING' }
  } else if (s.status === 'RUNNING') {
    const cases = caseResults(s.kind, s.challengeSlug, entry.outcome)
    const passed = cases.filter((c) => c.status === 'PASSED').length
    entry.submission = {
      ...s,
      status: passed === cases.length ? 'PASSED' : 'FAILED',
      passedCount: passed,
      finishedAt: new Date().toISOString(),
      cases,
    }
  }
}

function best(sessionId: string, slug: string): Submission | null {
  return (
    [...state.submissions.values()]
      .filter(
        (s) =>
          s.sessionId === sessionId &&
          s.submission.kind === 'SUBMIT' &&
          s.submission.challengeSlug === slug &&
          isFinal(s.submission.status),
      )
      .map((s) => s.submission)
      .sort((a, b) => b.passedCount - a.passedCount || a.createdAt.localeCompare(b.createdAt))[0] ??
    null
  )
}

function finalize(entry: Stored) {
  const { session } = entry
  if (session.status !== 'SUBMITTED' || pending(session.id).length > 0) return
  const hits = session.questions.filter((q) => entry.correct.get(q.position)).length
  const objective = session.questions.length ? hits / session.questions.length : 0
  for (const q of session.questions) if (entry.correct.get(q.position)) markSolved(q.slug)
  let xp = 0
  if (session.format === 'SIMULATION') {
    const ratios = session.challenges.map((c) => {
      const b = best(session.id, c.slug)
      c.bestSubmissionId = b?.id ?? null
      if (b?.status === 'PASSED') markSolved(c.slug)
      return b ? b.passedCount / b.totalCount : 0
    })
    const challenge = ratios.reduce((sum, r) => sum + r, 0) / ratios.length
    const final = 0.5 * objective + 0.5 * challenge
    const practiced =
      session.questions.some((q) => entry.correct.has(q.position)) ||
      session.challenges.some((c) => c.submissionsUsed > 0 || c.bestSubmissionId !== null)
    xp = practiced ? Math.max(10, Math.round(100 * final)) : 0
    if (xp > 0) recordSimulation(xp)
    unlockExam()
    entry.newAchievements =
      xp > 0
        ? [
            ...(unlockAchievement('primeira-simulacao') ? ['primeira-simulacao'] : []),
            ...checkProgressAchievements(practiceProgress()),
          ]
        : []
    Object.assign(session, {
      finalScore: final,
      objectiveScore: objective,
      challengeScore: challenge,
    })
  } else {
    Object.assign(session, { finalScore: null, objectiveScore: objective, challengeScore: null })
  }
  Object.assign(session, { xpAwarded: xp, finishedAt: new Date().toISOString() })
  session.status = 'COMPLETED'
}

function submit(entry: Stored) {
  if (entry.session.status === 'IN_PROGRESS') entry.session.status = 'SUBMITTED'
  finalize(entry)
}

function feedback(entry: Stored): CompetencyResult[] {
  const groups = new Map<string, { result: CompetencyResult; order: number }>()
  const add = (slug: string, hit: boolean) => {
    const competency = practiceProblem(slug).competency
    const key = competency?.slug ?? ''
    const group = groups.get(key) ?? {
      order: competency ? groups.size : Number.MAX_SAFE_INTEGER,
      result: { competency, hits: 0, total: 0, verdict: 'OK', text: '' },
    }
    group.result.total += 1
    if (hit) group.result.hits += 1
    groups.set(key, group)
  }
  for (const q of entry.session.questions) add(q.slug, entry.correct.get(q.position) ?? false)
  for (const c of entry.session.challenges) {
    add(c.slug, best(entry.session.id, c.slug)?.status === 'PASSED')
  }
  return [...groups.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ result }) => {
      const ratio = result.hits / result.total
      const verdict = ratio >= 0.7 ? 'STRONG' : ratio < 0.5 ? 'GAP' : 'OK'
      const where = result.competency?.name ?? 'outros temas'
      const text =
        verdict === 'STRONG'
          ? `Você acertou ${result.hits} de ${result.total} em ${where}: ponto forte.`
          : verdict === 'OK'
            ? `Você acertou ${result.hits} de ${result.total} em ${where}: falta pouco para virar ponto forte.`
            : result.competency
              ? `${result.hits} de ${result.total} em ${where}: vale revisar os materiais da competência.`
              : `${result.hits} de ${result.total} em ${where}: vale revisar esses temas.`
      return { ...result, verdict, text }
    })
}

function resultOf(entry: Stored): SessionResult {
  const s = entry.session as Session & {
    finalScore: number | null
    objectiveScore: number
    challengeScore: number | null
    xpAwarded: number
    finishedAt: string
  }
  const view = viewOf(entry)
  return {
    status: 'COMPLETED',
    finalScore: s.finalScore,
    objectiveScore: s.objectiveScore,
    challengeScore: s.challengeScore,
    xpAwarded: s.xpAwarded,
    finishedAt: s.finishedAt,
    newAchievements: entry.newAchievements,
    competencies: feedback(entry),
    questions: view.questions.map((q) => ({
      position: q.position,
      slug: q.slug,
      title: q.title,
      correct: q.correct ?? false,
      chosenOptionId: q.chosenOptionId,
      correctOptionId: q.correctOptionId!,
      explanation: q.explanation!,
    })),
    challenges: s.challenges.map((c) => {
      const b = best(s.id, c.slug)
      return {
        position: c.position,
        slug: c.slug,
        title: c.title,
        passedCount: b?.passedCount ?? 0,
        totalCount: TOTAL_CASES[c.slug],
        bestSubmissionId: b?.id ?? null,
      }
    }),
  }
}

function summaryOf({ session }: Stored): SessionSummary {
  const s = session as Session & {
    finalScore?: number | null
    xpAwarded?: number
    finishedAt?: string
  }
  return {
    id: s.id,
    format: s.format,
    area: s.area,
    level: s.level,
    competency: s.competency,
    status: s.status,
    finalScore: s.finalScore ?? null,
    xpAwarded: s.xpAwarded ?? 0,
    startedAt: s.startedAt,
    finishedAt: s.finishedAt ?? null,
  }
}

const unauthorized = () => problem(401, 'Não autenticado', 'Token ausente.')
const notFound = () => problem(404, 'Não encontrado', 'Sessão não encontrada.')
const closed = () =>
  problem(422, 'Dados inválidos', 'Esta sessão não aceita mais respostas nem envios.')

function inProgress(session: Session) {
  return HttpResponse.json(
    {
      type: 'about:blank',
      title: 'Sessão em andamento',
      status: 409,
      detail:
        session.format === 'SIMULATION'
          ? 'Você já tem uma simulação em andamento.'
          : 'Você já tem uma lição em andamento.',
      sessionId: session.id,
    },
    { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

function makeRoom() {
  const current = open()
  if (!current) return null
  if (current.session.format === 'SIMULATION') return inProgress(current.session)
  submit(current)
  return null
}

function code(kind: SubmissionKind) {
  return async ({ request, params }: { request: Request; params: Record<string, unknown> }) => {
    if (!request.headers.get('Authorization')) return unauthorized()
    const entry = stored(String(params.id))
    if (!entry) return notFound()
    const position = Number(params.position)
    const challenge = entry.session.challenges.find((c) => c.position === position)
    if (!challenge) {
      return problem(422, 'Dados inválidos', `Não existe desafio ${position} nesta sessão.`)
    }
    if (entry.session.status !== 'IN_PROGRESS') return closed()
    if (kind === 'SUBMIT' && challenge.submissionsLeft === 0) {
      return problem(422, 'Dados inválidos', `Os 5 envios do desafio ${position} já foram usados.`)
    }
    const body = (await request.json()) as { language: ChallengeLanguage; sourceCode: string }
    state.counter += 1
    const id = `sessao-envio-${state.counter}`
    const submission: Submission = {
      id,
      challengeSlug: challenge.slug,
      kind,
      language: body.language,
      sourceCode: body.sourceCode,
      status: 'QUEUED',
      passedCount: 0,
      totalCount: kind === 'RUN' ? 2 : TOTAL_CASES[challenge.slug],
      compileOutput: null,
      errorMessage: null,
      xpGained: 0,
      createdAt: new Date(Date.now() + state.counter).toISOString(),
      finishedAt: null,
      cases: [],
      sealed: false,
    }
    state.submissions.set(id, { submission, sessionId: entry.session.id, outcome: state.next })
    if (kind === 'SUBMIT') {
      state.next = 'PASSED'
      challenge.submissionsUsed += 1
      challenge.submissionsLeft -= 1
      challenge.lastSubmissionId = id
    }
    return HttpResponse.json({ id, status: 'QUEUED' }, { status: 202 })
  }
}

export function sessionHandlers() {
  return [
    http.post('/api/v1/sessions/lessons', async ({ request }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const { competency } = (await request.json()) as { competency: string }
      const detail = competencyDetail(competency)
      if (!detail) {
        return problem(404, 'Não encontrado', `Competência fora da sua trilha: ${competency}.`)
      }
      const blocked = makeRoom()
      if (blocked) return blocked
      const lesson = lessonOf(competency)
      if (!lesson) {
        return problem(
          422,
          'Dados inválidos',
          `${detail.name} não tem questões suficientes para uma lição.`,
        )
      }
      return HttpResponse.json(sessionSnapshot(lesson.id), { status: 201 })
    }),
    http.post('/api/v1/sessions/simulations', async ({ request }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const { area, level } = (await request.json()) as { area: string; level: string }
      const known = LEVELS.find((value) => value === level)
      if (area !== 'backend' || !known) {
        return problem(
          422,
          'Dados inválidos',
          `Não há questões e desafios suficientes para uma simulação de ${area} ${LEVEL_NAMES[level] ?? level}.`,
        )
      }
      const blocked = makeRoom()
      if (blocked) return blocked
      return HttpResponse.json(sessionSnapshot(openSimulation({ level: known }).id), {
        status: 201,
      })
    }),
    http.get('/api/v1/sessions/current', ({ request }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const current = open()
      return current ? HttpResponse.json(viewOf(current)) : notFound()
    }),
    http.get('/api/v1/sessions', ({ request }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      return HttpResponse.json([...state.sessions.values()].reverse().map(summaryOf))
    }),
    http.get('/api/v1/sessions/:id/result', ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const entry = stored(String(params.id))
      if (!entry) return notFound()
      if (entry.session.status !== 'COMPLETED') {
        return problem(404, 'Não encontrado', 'O resultado sai quando a correção terminar.')
      }
      return HttpResponse.json(resultOf(entry))
    }),
    http.get('/api/v1/sessions/:id', ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const entry = stored(String(params.id))
      if (!entry) return notFound()
      if (entry.session.status === 'SUBMITTED' && !state.paused) {
        pending(entry.session.id).forEach(advance)
        finalize(entry)
      }
      return HttpResponse.json(viewOf(entry))
    }),
    http.put('/api/v1/sessions/:id/questions/:position', async ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const entry = stored(String(params.id))
      if (!entry) return notFound()
      const position = Number(params.position)
      const question = entry.session.questions.find((q) => q.position === position)
      if (!question) {
        return problem(422, 'Dados inválidos', `Não existe questão ${position} nesta sessão.`)
      }
      if (entry.session.status !== 'IN_PROGRESS') return closed()
      const { optionId } = (await request.json()) as { optionId: string }
      const body = practiceProblem(question.slug).question!
      const index = practiceQuestion(question.slug).options.findIndex((o) => o.id === optionId)
      if (index < 0) {
        return problem(422, 'Dados inválidos', 'A alternativa escolhida não é desta questão.')
      }
      let xpGained = 0
      let newAchievements: string[] = []
      if (entry.session.format === 'LESSON') {
        if (question.chosenOptionId !== null) {
          return problem(422, 'Dados inválidos', 'Esta questão da lição já foi respondida.')
        }
        xpGained = answerPractice(question.slug, optionId)!.xpGained
        newAchievements = checkProgressAchievements(practiceProgress())
      }
      question.chosenOptionId = optionId
      entry.correct.set(position, index === body.correct)
      if (
        entry.session.format === 'LESSON' &&
        entry.session.questions.every((q) => q.chosenOptionId !== null)
      ) {
        submit(entry)
      }
      const view = viewOf(entry).questions.find((q) => q.position === position)!
      const answer: SessionAnswer = {
        ...view,
        xpGained,
        sessionStatus: entry.session.status,
        newAchievements,
      }
      return HttpResponse.json(answer)
    }),
    http.post('/api/v1/sessions/:id/challenges/:position/runs', code('RUN')),
    http.post('/api/v1/sessions/:id/challenges/:position/submissions', code('SUBMIT')),
    http.post('/api/v1/sessions/:id/finish', ({ request, params }) => {
      if (!request.headers.get('Authorization')) return unauthorized()
      const entry = stored(String(params.id))
      if (!entry) return notFound()
      submit(entry)
      return HttpResponse.json({ status: entry.session.status }, { status: 202 })
    }),
    http.get('/api/v1/submissions/:id', ({ request, params }) => {
      const entry = state.submissions.get(String(params.id))
      if (!entry) return undefined
      if (!request.headers.get('Authorization')) return unauthorized()
      if (!state.paused) advance(entry)
      const session = stored(entry.sessionId)!.session
      const sealed =
        entry.submission.kind === 'SUBMIT' &&
        (session.status === 'IN_PROGRESS' || session.status === 'SUBMITTED')
      return HttpResponse.json(
        sealed
          ? {
              ...entry.submission,
              cases: [],
              compileOutput: null,
              errorMessage: null,
              sealed: true,
            }
          : entry.submission,
      )
    }),
  ]
}
