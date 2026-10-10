import { Navigate, Outlet, useLocation } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { paths } from '@/app/paths'
import { appTexts } from '@/app/texts'
import { selectSessionNotice, selectSessionStatus } from '@/features/auth/slice'
import { PageSkeleton } from '@/components/Skeleton'

export function RequireAuth() {
  const status = useAppSelector(selectSessionStatus)
  const notice = useAppSelector(selectSessionNotice)
  const location = useLocation()
  if (status === 'unknown')
    return (
      <div className="mx-auto max-w-5xl p-8">
        <PageSkeleton label={appTexts.loading} />
      </div>
    )
  if (status === 'anonymous') {
    const from = location.pathname + location.search + location.hash
    const to = notice ? `${paths.login}?notice=${notice}` : paths.login
    return <Navigate to={to} replace state={{ from }} />
  }
  return <Outlet />
}
