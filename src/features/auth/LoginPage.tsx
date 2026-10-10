import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppDispatch } from '@/app/hooks'
import { homeFor, paths } from '@/app/paths'
import { useFormProblem } from '@/lib/useFormProblem'
import { useLoginMutation } from './api'
import { AuthLayout } from './AuthLayout'
import { errorId, fieldA11y } from './fieldA11y'
import { FieldError } from './FieldError'
import { PasswordField } from './PasswordField'
import { loginSchema, type LoginForm } from './schemas'
import { noticeCleared, type SessionNotice } from './slice'
import { SocialButtons } from './SocialButtons'
import { authTexts } from './texts'

const t = authTexts.login
const FORM_FIELDS = ['email', 'password'] as const
type UrlError = keyof typeof t.errors
const NOTICES: Record<SessionNotice, string> = {
  'password-changed': t.passwordChanged,
  'password-conflict': t.passwordConflict,
}

function safeFrom(from: unknown) {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : null
}

export function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const location = useLocation()
  const [params] = useSearchParams()
  const [login, { isLoading, error }] = useLoginMutation()
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const urlError = params.get('error')
  const urlMessage =
    urlError && Object.hasOwn(t.errors, urlError) ? t.errors[urlError as UrlError] : null
  const noticeKey = params.get('notice')
  const notice =
    noticeKey && Object.hasOwn(NOTICES, noticeKey) ? NOTICES[noticeKey as SessionNotice] : null
  useEffect(() => {
    if (notice) dispatch(noticeCleared())
  }, [notice, dispatch])
  const { alertMessage } = useFormProblem<LoginForm>(error, FORM_FIELDS, form.setError)
  const from = safeFrom((location.state as { from?: unknown } | null)?.from)

  async function onSubmit(values: LoginForm) {
    const result = await login(values)
    if (result.data) navigate(from ?? homeFor(result.data.user), { replace: true })
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{t.title}</h1>
          </CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notice && (
            <Alert role="status">
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          )}
          {(alertMessage ?? urlMessage) && (
            <Alert variant="destructive">
              <AlertDescription>{alertMessage ?? urlMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                {...fieldA11y('email', form.formState.errors.email?.message)}
                type="email"
                autoComplete="email"
                {...form.register('email')}
              />
              <FieldError id={errorId('email')} message={form.formState.errors.email?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">{t.password}</Label>
              <PasswordField
                id="password"
                {...fieldA11y('password', form.formState.errors.password?.message)}
                autoComplete="current-password"
                {...form.register('password')}
              />
              <FieldError
                id={errorId('password')}
                message={form.formState.errors.password?.message}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t.submitting : t.submit}
            </Button>
          </form>
          <SocialButtons />
          <p className="text-center text-sm text-muted-foreground">
            {t.noAccount}{' '}
            <Link to={paths.register} className="underline">
              {t.goRegister}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
