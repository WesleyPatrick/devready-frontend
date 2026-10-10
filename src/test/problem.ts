import { HttpResponse } from 'msw'

export const problem = (
  status: number,
  title: string,
  detail: string,
  errors?: { field: string; message: string }[],
) =>
  HttpResponse.json(
    { type: 'about:blank', title, status, detail, errors },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

export const passwordChangeRequired = () =>
  HttpResponse.json(
    {
      type: 'about:blank',
      title: 'Senha provisória',
      status: 403,
      detail: 'Defina uma senha nova para continuar.',
      code: 'password_change_required',
    },
    { status: 403, headers: { 'Content-Type': 'application/problem+json' } },
  )

export const passwordConflict = () =>
  problem(409, 'Conflito', 'Sua senha foi alterada por outro caminho. Entre de novo.')
