import { CircleCheck, CircleSlash, ListFilter, Search, Shield, ShieldOff } from 'lucide-react'
import { createElement, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { appTexts } from '@/app/texts'
import { DataTable, type Column } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import { FilterMenu } from '@/components/FilterMenu'
import { Panel } from '@/components/Panel'
import { RetryAlert } from '@/components/RetryAlert'
import { Loading, TableSkeleton } from '@/components/Skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { selectCurrentUser } from '@/features/auth/slice'
import type { Role } from '@/features/auth/types'
import { ConfirmDialog } from '@/features/challenge/ConfirmDialog'
import { Pagination } from '@/features/questions/Pagination'
import { formatList, formatRelative } from '@/lib/format'
import { ALL_FILTER } from '@/lib/learning'
import { monogramOf } from '@/lib/monograms'
import { getProblem } from '@/lib/problem'
import { useDebounced } from '@/lib/useDebounced'
import { cn } from '@/lib/utils'
import { useChangeUserAccessMutation, useGetAdminUsersQuery } from './api'
import { PAGE_SIZE } from './paging'
import { searchDelay } from './searchDelay'
import { adminTexts } from './texts'
import { TemporaryPasswordDialog } from './TemporaryPasswordDialog'
import type { AccessAction, AdminUser, ChangeUserAccessBody, RowAction } from './types'
import { usePasswordReset } from './usePasswordReset'
import { UserActions } from './UserActions'

const t = adminTexts

const ROLES: readonly Role[] = ['CANDIDATE', 'ADMIN']
const SITUATIONS = ['true', 'false'] as const
const BODIES: Record<AccessAction, ChangeUserAccessBody> = {
  deactivate: { active: false },
  activate: { active: true },
  promote: { role: 'ADMIN' },
  demote: { role: 'CANDIDATE' },
}

type Confirmation = { user: AdminUser; action: RowAction; open: boolean }

function accessOf(user: AdminUser) {
  return formatList([
    ...(user.hasPassword ? [t.access.password] : []),
    ...user.socialProviders.map((provider) => t.access[provider]),
  ])
}

function Person({ user, isMe }: { user: AdminUser; isMe: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar className="size-7 shrink-0" aria-hidden>
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
        <AvatarFallback className="bg-muted font-mono text-xs">
          {monogramOf(user.id, user.displayName).initials}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-medium">
          <span className="truncate">{user.displayName}</span>
          {isMe && <Badge variant="secondary">{t.you}</Badge>}
        </span>
        <span className="block truncate text-xs text-muted-foreground md:hidden">{user.email}</span>
      </span>
    </span>
  )
}

function Situation({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {createElement(active ? CircleCheck : CircleSlash, {
        className: cn('size-4', active ? 'text-easy' : 'text-muted-foreground'),
        'aria-hidden': true,
      })}
      {active ? t.situation.active : t.situation.inactive}
    </span>
  )
}

export default function AdminUsersPage() {
  const [params, setParams] = useSearchParams()
  const me = useAppSelector(selectCurrentUser)
  const search = useRef<HTMLInputElement>(null)

  const q = params.get('q') ?? ''
  const rawRole = params.get('role')
  const role = ROLES.find((value) => value === rawRole)
  const rawActive = params.get('active')
  const situation = SITUATIONS.find((value) => value === rawActive)
  const page = Math.max(1, Math.floor(Number(params.get('page'))) || 1)

  const [term, setTerm] = useState(q)
  const settled = useDebounced(term.trim(), searchDelay())
  useEffect(() => {
    if (settled === (params.get('q') ?? '')) return
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('page')
        if (settled) next.set('q', settled)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [settled])

  const { data, error, isFetching, refetch } = useGetAdminUsersQuery({
    page,
    size: PAGE_SIZE,
    q: q || undefined,
    role,
    active: situation === undefined ? undefined : situation === 'true',
  })
  const [change, changeState] = useChangeUserAccessMutation()
  const passwordReset = usePasswordReset()
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [lostAccess, setLostAccess] = useState(false)
  if (!lostAccess && getProblem(error)?.status === 403) setLostAccess(true)
  const [announcement, setAnnouncement] = useState({ text: '', id: 0 })

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries({ page: undefined, ...changes })) {
      if (value === undefined || value === ALL_FILTER) next.delete(key)
      else next.set(key, value)
    }
    setParams(next)
  }

  function choose(user: AdminUser, action: RowAction) {
    changeState.reset()
    passwordReset.clearError()
    setConfirmation({ user, action, open: true })
  }

  function close() {
    setConfirmation((current) => current && { ...current, open: false })
  }

  async function confirm() {
    if (!confirmation) return
    const { user, action } = confirmation
    if (action === 'resetPassword') {
      const error = await passwordReset.generate(user)
      if (!error) close()
      else if (getProblem(error)?.status === 403) setLostAccess(true)
      return
    }
    const result = await change({ id: user.id, body: BODIES[action] })
    if ('data' in result) {
      const text = t.done[action](user.displayName)
      setAnnouncement((current) => ({ text, id: current.id + 1 }))
      close()
    } else if (getProblem(result.error)?.status === 403) {
      setLostAccess(true)
    }
  }

  const forbidden = lostAccess || getProblem(error)?.status === 403
  const resetting = confirmation?.action === 'resetPassword'
  const actionError = resetting ? passwordReset.error : changeState.error
  const changeError = actionError
    ? (getProblem(actionError)?.detail ?? appTexts.networkError)
    : null
  const rowButton = (user: AdminUser) =>
    document.querySelector<HTMLElement>(`[data-user-id="${user.id}"]`) ?? search.current

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: t.columns.name,
      cell: (user) => <Person user={user} isMe={user.id === me?.id} />,
    },
    {
      key: 'email',
      header: t.columns.email,
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell',
      cell: (user) => user.email,
    },
    { key: 'role', header: t.columns.role, cell: (user) => t.roles[user.role] },
    {
      key: 'situation',
      header: t.columns.situation,
      cell: (user) => <Situation active={user.active} />,
    },
    {
      key: 'access',
      header: t.columns.access,
      headerClassName: 'hidden lg:table-cell',
      className: 'hidden lg:table-cell',
      cell: accessOf,
    },
    {
      key: 'createdAt',
      header: t.columns.createdAt,
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden whitespace-nowrap sm:table-cell',
      cell: (user) => <time dateTime={user.createdAt}>{formatRelative(user.createdAt)}</time>,
    },
    {
      key: 'actions',
      header: <span className="sr-only">{t.columns.actions}</span>,
      className: 'w-10 text-right',
      cell: (user) =>
        user.id === me?.id ? (
          <span className="sr-only">{t.youHint}</span>
        ) : (
          <UserActions user={user} onChoose={(action) => choose(user, action)} />
        ),
    },
  ]

  const errorAlert = (
    <RetryAlert message={t.error} retrying={isFetching} onRetry={() => void refetch()} />
  )

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-8 w-full items-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring sm:w-72">
          <Search className="size-3.5 shrink-0" aria-hidden />
          <input
            ref={search}
            type="search"
            aria-label={t.search.label}
            placeholder={t.search.placeholder}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
        <FilterMenu
          label={t.filters.role}
          icon={Shield}
          value={role ?? ALL_FILTER}
          onChange={(value) => update({ role: value })}
          options={[
            { value: ALL_FILTER, label: t.filters.allRoles },
            ...ROLES.map((value) => ({ value, label: t.filters.roles[value] })),
          ]}
        />
        <FilterMenu
          label={t.filters.situation}
          icon={ListFilter}
          value={situation ?? ALL_FILTER}
          onChange={(value) => update({ active: value })}
          options={[
            { value: ALL_FILTER, label: t.filters.allSituations },
            ...SITUATIONS.map((value) => ({ value, label: t.filters.situations[value] })),
          ]}
        />
        <p role="status" className="text-xs text-muted-foreground">
          {isFetching && data && !forbidden ? t.updating : null}
        </p>
      </div>
      {forbidden ? (
        <div role="alert">
          <EmptyState icon={ShieldOff} title={t.noAccess} />
        </div>
      ) : data ? (
        <Panel className="space-y-3">
          {error && errorAlert}
          <div aria-busy={isFetching || undefined}>
            <DataTable
              caption={t.caption}
              columns={columns}
              rows={data.items}
              rowKey={(user) => user.id}
              empty={t.empty}
            />
          </div>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(next) => update({ page: String(next) })}
          />
        </Panel>
      ) : error ? (
        errorAlert
      ) : (
        <Loading label={t.loading} className="space-y-3">
          <TableSkeleton rows={8} />
        </Loading>
      )}
      <p role="status" className="sr-only">
        <span key={announcement.id}>{announcement.text}</span>
      </p>
      {confirmation && (
        <ConfirmDialog
          open={confirmation.open}
          title={t.confirm[confirmation.action].title(confirmation.user.displayName)}
          body={t.confirm[confirmation.action].body}
          action={t.actions[confirmation.action]}
          busy={resetting ? passwordReset.busy : changeState.isLoading}
          error={changeError}
          onConfirm={() => void confirm()}
          onCancel={close}
          returnFocusTo={() => rowButton(confirmation.user)}
        />
      )}
      <TemporaryPasswordDialog
        revealed={passwordReset.revealed}
        onClose={passwordReset.forget}
        returnFocusTo={rowButton}
      />
    </div>
  )
}
