import type { CaseStatus, ChallengeLanguage, SubmissionStatus } from './types'

const seconds = (ms: number) => `${(ms / 1000).toLocaleString('pt-BR')} s`

export const challengeTexts = {
  editor: {
    label: 'Código',
    loading: 'Carregando o editor…',
  },
  languages: {
    JAVA: 'Java',
    PYTHON: 'Python',
    JAVASCRIPT: 'JavaScript',
  } satisfies Record<ChallengeLanguage, string>,
  page: {
    inExam: 'Desafio em prova',
    inExamBody: 'Este desafio está na sua simulação em andamento.',
    continueExam: 'Continuar a simulação',
    back: 'Questões',
    backToQuestions: 'Voltar para Questões',
    loading: 'Carregando o desafio…',
    error: 'Não foi possível carregar o desafio.',
    notFound: 'Desafio não encontrado',
    notFoundBody: 'O endereço pode estar errado, ou o desafio saiu do catálogo.',
    xp: (n: number) => `+${n} XP`,
    areas: 'Áreas do desafio',
    mobileTabs: { statement: 'Enunciado', code: 'Código', result: 'Resultado' },
  },
  statement: {
    tabs: 'Enunciado e envios',
    statement: 'Enunciado',
    submissions: 'Envios',
    examples: 'Exemplos',
    example: (n: number) => `Exemplo ${n}`,
    hidden: (n: number) =>
      n === 1 ? 'Mais 1 caso oculto no envio.' : `Mais ${n} casos ocultos no envio.`,
    limits: (ms: number) => `Tempo: ${seconds(ms)} para todos os casos juntos.`,
    approach: 'Abordagem',
  },
  cases: { input: 'Entrada', expected: 'Esperado', actual: 'Obtido', error: 'Erro' },
  history: {
    label: 'Envios do desafio',
    loading: 'Carregando envios…',
    error: 'Não foi possível carregar os envios.',
    empty: 'Nenhum envio ainda. Cada envio aparece aqui; rodar não entra na lista.',
    status: {
      QUEUED: 'Na fila',
      RUNNING: 'Rodando',
      PASSED: 'Aceito',
      FAILED: 'Falhou',
      COMPILE_ERROR: 'Erro de compilação',
      RUNTIME_ERROR: 'Erro de execução',
      TIME_LIMIT: 'Tempo esgotado',
      ERROR: 'Erro do sistema',
    } satisfies Record<SubmissionStatus, string>,
    meta: (language: string, passed: number, total: number, when: string) =>
      `${language} · ${passed} de ${total} casos · ${when}`,
    open: 'Abrir no editor',
    openTarget: (status: string, language: string, when: string) =>
      `: ${status}, ${language}, ${when}`,
    openError: 'Não deu para abrir este envio. Tente de novo.',
  },
  toolbar: { language: 'Linguagem', reset: 'Restaurar código inicial' },
  console: {
    label: 'Console',
    tabs: 'Casos e resultado',
    cases: 'Casos de teste',
    result: 'Resultado',
    run: 'Rodar',
    submit: 'Enviar',
    shortcut: 'Ctrl/Cmd+Enter roda. Ctrl+M (no Mac, Ctrl+Shift+M) solta o Tab do editor.',
    idle: 'Rode para testar com os casos visíveis, ou envie para rodar todos.',
    rateLimited: 'Muitas execuções seguidas. Espere alguns segundos.',
    requestError: 'Não deu para mandar o código. Tente de novo.',
  },
  result: {
    QUEUED: 'Na fila…',
    RUNNING: 'Rodando…',
    PASSED: 'Aceito',
    FAILED: 'Falhou',
    COMPILE_ERROR: 'Erro de compilação',
    RUNTIME_ERROR: 'Erro de execução',
    TIME_LIMIT: 'Tempo esgotado',
    ERROR: 'Não deu para executar agora. Tente de novo.',
    runPassed: 'Passou nos casos visíveis',
    runHint: 'Envie para rodar também os casos ocultos.',
    alreadySolved: 'Você já tinha resolvido este desafio; o XP não soma de novo.',
    timeLimit: (ms: number) => `O tempo de ${seconds(ms)} acabou antes de todos os casos.`,
    cases: (passed: number, total: number) => `${passed} de ${total} casos`,
    xp: (n: number) => `+${n} XP`,
    caseList: 'Casos',
    caseLabel: (n: number) => `Caso ${n}`,
    caseStatus: {
      PASSED: 'passou',
      FAILED: 'falhou',
      ERROR: 'erro',
      TIME_LIMIT: 'sem tempo',
    } satisfies Record<CaseStatus, string>,
    hiddenCase: (n: number, status: string) => `Caso ${n}, oculto: ${status}`,
    announce: {
      passed: (passed: number, total: number, xp: number) =>
        `Aceito: ${passed} de ${total} casos.${xp > 0 ? ` Mais ${xp} XP.` : ''}`,
      runPassed: (total: number) => `Passou nos ${total} casos visíveis.`,
      failed: (passed: number, total: number) => `Falhou: ${passed} de ${total} casos.`,
      timeLimit: (passed: number, total: number) => `Tempo esgotado: ${passed} de ${total} casos.`,
    },
  },
  confirm: {
    cancel: 'Cancelar',
    resetTitle: 'Restaurar o código inicial?',
    resetBody: (language: string) =>
      `O código de ${language} volta ao inicial, e o rascunho se perde.`,
    resetAction: 'Restaurar',
    openTitle: 'Abrir este envio no editor?',
    openBody: (language: string) =>
      `O código de ${language} no editor é trocado pelo do envio, e o rascunho se perde.`,
    openAction: 'Abrir',
  },
} as const
