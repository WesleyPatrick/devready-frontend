import { renderHook } from '@testing-library/react'
import { appTexts } from '@/app/texts'
import { useFormProblem } from './useFormProblem'

type Form = { email: string; password: string }
const FIELDS = ['email', 'password'] as const

function problemError(detail: string, errors?: { field: string; message: string }[]) {
  return { status: 422, data: { title: 'Dados inválidos', detail, errors } }
}

describe('useFormProblem', () => {
  it('sem erro não mostra alerta nem mexe no formulário', () => {
    const setError = vi.fn()
    const { result } = renderHook(() => useFormProblem<Form>(undefined, FIELDS, setError))
    expect(result.current.alertMessage).toBeNull()
    expect(setError).not.toHaveBeenCalled()
  })

  it('erro sem ProblemDetail (rede fora) vira o texto de erro de rede', () => {
    const setError = vi.fn()
    const error = { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }
    const { result } = renderHook(() => useFormProblem<Form>(error, FIELDS, setError))
    expect(result.current.alertMessage).toBe(appTexts.networkError)
  })

  it('sem erros de campo mostra o detail', () => {
    const setError = vi.fn()
    const { result } = renderHook(() =>
      useFormProblem<Form>(problemError('E-mail ou senha incorretos.'), FIELDS, setError),
    )
    expect(result.current.alertMessage).toBe('E-mail ou senha incorretos.')
    expect(setError).not.toHaveBeenCalled()
  })

  it('erro de campo conhecido vai para o campo, sem alerta', () => {
    const setError = vi.fn()
    const error = problemError('Confira.', [{ field: 'email', message: 'E-mail já usado.' }])
    const { result } = renderHook(() => useFormProblem<Form>(error, FIELDS, setError))
    expect(result.current.alertMessage).toBeNull()
    expect(setError).toHaveBeenCalledWith('email', { message: 'E-mail já usado.' })
  })

  it('erro de campo desconhecido vai para o alerta', () => {
    const setError = vi.fn()
    const error = problemError('Confira.', [
      { field: 'email', message: 'E-mail já usado.' },
      { field: 'phone', message: 'Telefone inválido.' },
      { field: 'bio', message: 'Bio longa.' },
    ])
    const { result } = renderHook(() => useFormProblem<Form>(error, FIELDS, setError))
    expect(result.current.alertMessage).toBe('Telefone inválido. Bio longa.')
    expect(setError).toHaveBeenCalledTimes(1)
  })

  it('não repete o setError quando o componente renderiza de novo com o mesmo erro', () => {
    const setError = vi.fn()
    const error = problemError('Confira.', [{ field: 'email', message: 'E-mail já usado.' }])
    const { rerender } = renderHook(() => useFormProblem<Form>(error, FIELDS, setError))
    rerender()
    rerender()
    expect(setError).toHaveBeenCalledTimes(1)
  })
})
