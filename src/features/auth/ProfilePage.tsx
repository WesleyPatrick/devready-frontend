import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, LoaderCircle, LogOut, Link2, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Panel } from '@/components/Panel'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { paths } from '@/app/paths'
import { endSession } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useFormProblem } from '@/lib/useFormProblem'
import { useGetCareerProfileQuery } from '@/features/career/api'
import { CareerSummaryCard } from '@/features/career/CareerSummaryCard'
import { isPasswordConflict, useLogoutAllMutation, useUpdateProfileMutation } from './api'
import { errorId, fieldA11y, hintId } from './fieldA11y'
import { FieldError } from './FieldError'
import { PasswordField } from './PasswordField'
import { profileSchema, type ProfileForm } from './schemas'
import { selectCurrentUser } from './slice'
import { authTexts } from './texts'

const t = authTexts.profile
const FORM_FIELDS = ['displayName', 'avatarUrl', 'currentPassword', 'newPassword'] as const

export function ProfilePage() {
  const user = useAppSelector(selectCurrentUser)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [updateProfile, { isLoading, error }] = useUpdateProfileMutation()
  const isAdmin = user?.role === 'ADMIN'
  const { data: career } = useGetCareerProfileQuery(undefined, { skip: isAdmin })
  const [logoutAll] = useLogoutAllMutation()
  const [saved, setSaved] = useState(false)
  const [flash, setFlash] = useState(false)
  const [shaking, setShaking] = useState(false)
  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(false), 1500)
    return () => clearTimeout(timer)
  }, [flash])
  const hasPassword = user?.hasPassword ?? false
  const schema = useMemo(() => profileSchema(hasPassword), [hasPassword])
  const form = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      avatarUrl: user?.avatarUrl ?? '',
      currentPassword: '',
      newPassword: '',
    },
  })

  const { alertMessage } = useFormProblem<ProfileForm>(error, FORM_FIELDS, form.setError)

  if (!user) return null

  async function onSubmit(values: ProfileForm) {
    if (isLoading) return
    setSaved(false)
    setFlash(false)
    setShaking(false)
    const changingPassword = !!values.newPassword
    const result = await updateProfile({
      displayName: values.displayName,
      avatarUrl: values.avatarUrl ? values.avatarUrl : null,
      currentPassword: changingPassword && hasPassword ? values.currentPassword : undefined,
      newPassword: changingPassword ? values.newPassword : undefined,
    })
    if (!('data' in result)) {
      if (isPasswordConflict(result.error)) {
        endSession(dispatch, 'password-conflict')
        return
      }
      setShaking(true)
      return
    }
    if (changingPassword) {
      endSession(dispatch, 'password-changed')
      return
    }
    setSaved(true)
    setFlash(true)
  }

  async function onLogoutAll() {
    await logoutAll()
    navigate(paths.login, { replace: true })
  }

  const passwordLabel = hasPassword ? t.newPassword : t.setPassword
  const passwordHint = hasPassword ? t.changePasswordHint : t.setPasswordHint

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
      {!isAdmin && career && <CareerSummaryCard profile={career} />}
      <Panel title={t.account} icon={UserRound} iconClassName="text-brand">
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {saved && (
            <Alert role="status">
              <AlertDescription>{t.saved}</AlertDescription>
            </Alert>
          )}
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
                {...form.register('displayName')}
              />
              <FieldError
                id={errorId('displayName')}
                message={form.formState.errors.displayName?.message}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="avatarUrl">{t.avatarUrl}</Label>
              <Input
                id="avatarUrl"
                {...fieldA11y('avatarUrl', form.formState.errors.avatarUrl?.message, true)}
                placeholder="https://"
                {...form.register('avatarUrl')}
              />
              <p id={hintId('avatarUrl')} className="text-xs text-muted-foreground">
                {t.avatarHint}
              </p>
              <FieldError
                id={errorId('avatarUrl')}
                message={form.formState.errors.avatarUrl?.message}
              />
            </div>
            {hasPassword && (
              <div className="space-y-1">
                <Label htmlFor="currentPassword">{t.currentPassword}</Label>
                <PasswordField
                  id="currentPassword"
                  {...fieldA11y(
                    'currentPassword',
                    form.formState.errors.currentPassword?.message,
                    true,
                  )}
                  autoComplete="current-password"
                  {...form.register('currentPassword')}
                />
                <p id={hintId('currentPassword')} className="text-xs text-muted-foreground">
                  {t.currentPasswordHint}
                </p>
                <FieldError
                  id={errorId('currentPassword')}
                  message={form.formState.errors.currentPassword?.message}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="newPassword">{passwordLabel}</Label>
              <PasswordField
                id="newPassword"
                {...fieldA11y('newPassword', form.formState.errors.newPassword?.message, true)}
                autoComplete="new-password"
                {...form.register('newPassword')}
              />
              <p id={hintId('newPassword')} className="text-xs text-muted-foreground">
                {passwordHint}
              </p>
              <FieldError
                id={errorId('newPassword')}
                message={form.formState.errors.newPassword?.message}
              />
            </div>
            <Button
              type="submit"
              aria-disabled={isLoading || undefined}
              className={cn(
                'aria-disabled:cursor-progress',
                flash && 'bg-easy text-background hover:bg-easy',
                shaking && 'animate-shake motion-reduce:animate-none',
              )}
              onAnimationEnd={() => setShaking(false)}
            >
              {isLoading ? (
                <>
                  <LoaderCircle
                    aria-hidden
                    data-icon="inline-start"
                    className="animate-spin motion-reduce:animate-none"
                  />
                  {t.saving}
                </>
              ) : flash ? (
                <>
                  <Check
                    aria-hidden
                    data-icon="inline-start"
                    className="[&>*]:animate-draw [&>*]:[stroke-dasharray:64] motion-reduce:[&>*]:animate-none"
                  />
                  {t.savedButton}
                </>
              ) : (
                t.save
              )}
            </Button>
          </form>
        </div>
      </Panel>

      <Panel title={t.providers} icon={Link2} iconClassName="text-brand">
        <div className="flex flex-wrap gap-2">
          {user.providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noProviders}</p>
          ) : (
            user.providers.map((provider) => (
              <Badge key={provider}>{authTexts.providers[provider]}</Badge>
            ))
          )}
        </div>
      </Panel>

      <Panel title={t.logoutAll} icon={LogOut} iconClassName="text-brand">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t.logoutAllHint}</p>
          <Button variant="destructive" onClick={onLogoutAll}>
            {t.logoutAll}
          </Button>
        </div>
      </Panel>
    </div>
  )
}
