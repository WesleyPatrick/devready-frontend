import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { endSession } from '@/lib/api'
import { getProblem } from '@/lib/problem'
import { useFormProblem } from '@/lib/useFormProblem'
import { isPasswordConflict, useReplaceTemporaryPasswordMutation } from './api'
import { errorId, fieldA11y, hintId } from './fieldA11y'
import { FieldError } from './FieldError'
import { PasswordField } from './PasswordField'
import { changePasswordSchema, type ChangePasswordForm } from './schemas'
import { selectCurrentUser } from './slice'
import { authTexts } from './texts'

const t = authTexts.changePassword
const FORM_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const

export function ChangePasswordPage() {
  const user = useAppSelector(selectCurrentUser)
  const dispatch = useAppDispatch()
  const [replace, { isLoading, error }] = useReplaceTemporaryPasswordMutation()
  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const problem = useMemo(() => getProblem(error), [error])
  const samePassword = problem?.status === 422 && Object.keys(problem.fieldErrors).length === 0
  const { setError } = form
  useEffect(() => {
    if (samePassword && problem) setError('newPassword', { message: problem.detail })
  }, [samePassword, problem, setError])
  const { alertMessage } = useFormProblem<ChangePasswordForm>(
    samePassword ? null : error,
    FORM_FIELDS,
    form.setError,
  )

  if (!user) return null

  async function onSubmit(values: ChangePasswordForm) {
    if (isLoading || !user) return
    const result = await replace({
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
    if (result.data) endSession(dispatch, 'password-changed')
    else if (isPasswordConflict(result.error)) endSession(dispatch, 'password-conflict')
  }

  const errors = form.formState.errors

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.body}</p>
      </div>
      {alertMessage && (
        <Alert variant="destructive">
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg bg-surface p-5 sm:p-6"
        noValidate
      >
        <div className="space-y-1">
          <Label htmlFor="currentPassword">{t.temporaryPassword}</Label>
          <PasswordField
            id="currentPassword"
            {...fieldA11y('currentPassword', errors.currentPassword?.message)}
            autoComplete="current-password"
            {...form.register('currentPassword')}
          />
          <FieldError id={errorId('currentPassword')} message={errors.currentPassword?.message} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="newPassword">{t.newPassword}</Label>
          <PasswordField
            id="newPassword"
            {...fieldA11y('newPassword', errors.newPassword?.message, true)}
            autoComplete="new-password"
            {...form.register('newPassword')}
          />
          <p id={hintId('newPassword')} className="text-xs text-muted-foreground">
            {t.newPasswordHint}
          </p>
          <FieldError id={errorId('newPassword')} message={errors.newPassword?.message} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
          <PasswordField
            id="confirmPassword"
            {...fieldA11y('confirmPassword', errors.confirmPassword?.message)}
            autoComplete="new-password"
            {...form.register('confirmPassword')}
          />
          <FieldError id={errorId('confirmPassword')} message={errors.confirmPassword?.message} />
        </div>
        <Button
          type="submit"
          className="w-full aria-disabled:cursor-progress"
          aria-disabled={isLoading || undefined}
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
    </div>
  )
}
