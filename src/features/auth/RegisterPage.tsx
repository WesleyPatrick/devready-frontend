import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { homeFor, paths } from '@/app/paths'
import { useFormProblem } from '@/lib/useFormProblem'
import { useRegisterMutation } from './api'
import { AuthLayout } from './AuthLayout'
import { errorId, fieldA11y, hintId } from './fieldA11y'
import { FieldError } from './FieldError'
import { PasswordField } from './PasswordField'
import { registerSchema, type RegisterForm } from './schemas'
import { SocialButtons } from './SocialButtons'
import { authTexts } from './texts'

const t = authTexts.register
const FORM_FIELDS = ['displayName', 'email', 'password'] as const

export function RegisterPage() {
  const navigate = useNavigate()
  const [register, { isLoading, error }] = useRegisterMutation()
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  })
  const { alertMessage } = useFormProblem<RegisterForm>(error, FORM_FIELDS, form.setError)

  async function onSubmit(values: RegisterForm) {
    if (isLoading) return
    const result = await register(values)
    if (result.data) navigate(homeFor(result.data.user), { replace: true })
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
          {alertMessage && (
            <Alert variant="destructive">
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="displayName">{t.displayName}</Label>
              <Input
                id="displayName"
                {...fieldA11y('displayName', form.formState.errors.displayName?.message)}
                autoComplete="name"
                {...form.register('displayName')}
              />
              <FieldError
                id={errorId('displayName')}
                message={form.formState.errors.displayName?.message}
              />
            </div>
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
                {...fieldA11y('password', form.formState.errors.password?.message, true)}
                autoComplete="new-password"
                {...form.register('password')}
              />
              <p id={hintId('password')} className="text-xs text-muted-foreground">
                {t.passwordHint}
              </p>
              <FieldError
                id={errorId('password')}
                message={form.formState.errors.password?.message}
              />
            </div>
            <Button
              type="submit"
              aria-disabled={isLoading || undefined}
              className="w-full aria-disabled:cursor-progress"
            >
              {isLoading ? (
                <>
                  <LoaderCircle
                    aria-hidden
                    data-icon="inline-start"
                    className="animate-spin motion-reduce:animate-none"
                  />
                  {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </Button>
          </form>
          <SocialButtons />
          <p className="text-center text-sm text-muted-foreground">
            {t.hasAccount}{' '}
            <Link to={paths.login} className="underline">
              {t.goLogin}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
