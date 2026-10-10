import { getProblem } from './problem'

describe('getProblem', () => {
  it('lê status, título, detalhe e erros de campo', () => {
    const problem = getProblem({
      status: 422,
      data: {
        title: 'Dados inválidos',
        detail: 'Confira.',
        errors: [{ field: 'email', message: 'E-mail inválido.' }],
      },
    })
    expect(problem).toEqual({
      status: 422,
      title: 'Dados inválidos',
      detail: 'Confira.',
      fieldErrors: { email: 'E-mail inválido.' },
    })
  })

  it('devolve null para erros que não são HTTP', () => {
    expect(getProblem(undefined)).toBeNull()
    expect(getProblem({ status: 'FETCH_ERROR', error: 'x' })).toBeNull()
  })

  it('usa título e detalhe genéricos quando a resposta não traz ProblemDetail', () => {
    expect(getProblem({ status: 502, data: '<html>Bad Gateway</html>' })).toEqual({
      status: 502,
      title: 'Erro',
      detail: 'Algo deu errado. Tente de novo.',
      fieldErrors: {},
    })
  })
})
