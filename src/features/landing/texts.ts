export const landingTexts = {
  hero: {
    title: 'Treine para a entrevista técnica das',
    highlight: 'empresas que você quer',
    body: 'Escolha até cinco empresas, sua stack e sua senioridade. A trilha vai mostrar o que as vagas delas pedem, em ordem, com questões, desafios de código e simulações cronometradas.',
    primary: 'Montar minha trilha',
    secondary: 'Ver como funciona',
    facts: {
      companies: (n: number) => `${n} empresas`,
      areas: '3 áreas',
      seniorities: 'júnior, pleno e sênior',
    },
  },
  example: {
    label: 'Exemplo de trilha',
    rows: [
      { status: 'DONE', category: 'fundamentos', name: 'Estruturas de dados', jobs: 80 },
      { status: 'IN_PROGRESS', category: 'dados', name: 'SQL e modelagem de dados', jobs: 70 },
      { status: 'NOT_STARTED', category: 'backend', name: 'APIs REST e HTTP', jobs: 70 },
      { status: 'NOT_STARTED', category: 'qualidade', name: 'Testes automatizados', jobs: 60 },
    ],
    total: 100,
    columns: { status: 'Situação', competency: 'Competência', jobs: 'Pedido em' },
  },
  how: {
    title: 'Como funciona',
    steps: [
      {
        title: 'Conte seu objetivo',
        body: 'Até cinco empresas, a stack e a senioridade da vaga que você quer.',
      },
      {
        title: 'Siga a trilha',
        body: 'As competências que essas vagas pedem, na ordem de estudo, com questões e a quantidade de vagas que pedem cada uma.',
      },
      {
        title: 'Treine como na entrevista',
        body: 'Questão do dia, sequência de dias e XP, lições curtas por competência e simulações com tempo marcado.',
      },
    ],
    note: 'A trilha usa uma primeira leva de vagas públicas das empresas da base. As questões, os desafios de código, as lições, as simulações e o progresso contam o que você faz de verdade.',
  },
  companies: {
    title: 'Empresas na base',
    body: 'As trilhas usam uma primeira leva de vagas públicas destas empresas.',
    loading: 'Carregando empresas…',
  },
  cta: { title: 'Comece pelo seu objetivo', body: 'Leva dois minutos.', action: 'Criar conta' },
} as const
