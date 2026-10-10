import { Navigate, Outlet } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { homeFor } from '@/app/paths'
import { appTexts } from '@/app/texts'
import { selectCurrentUser, selectSessionStatus } from '@/features/auth/slice'
import { PageSkeleton } from '@/components/Skeleton'

export function RedirectIfAuthenticated() {
  const status = useAppSelector(selectSessionStatus)
  const user = useAppSelector(selectCurrentUser)
  if (status === 'unknown')
    return (
      <div className="mx-auto max-w-5xl p-8">
        <PageSkeleton label={appTexts.loading} />
      </div>
    )
  if (status === 'authenticated') return <Navigate to={homeFor(user)} replace />
  return <Outlet />
}
