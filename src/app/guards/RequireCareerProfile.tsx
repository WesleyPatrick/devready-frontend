import { Navigate, Outlet, useLocation } from 'react-router'
import { RetryAlert } from '@/components/RetryAlert'
import { useAppSelector } from '@/app/hooks'
import { paths } from '@/app/paths'
import { FocusedFrame } from '@/app/layout/FocusedLayout'
import { selectCurrentUser } from '@/features/auth/slice'
import { useGetCareerProfileQuery } from '@/features/career/api'
import { careerTexts } from '@/features/career/texts'
import { PageSkeleton } from '@/components/Skeleton'

const t = careerTexts.guard

function isNotFound(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404
}

export function RequireCareerProfile() {
  const isAdmin = useAppSelector(selectCurrentUser)?.role === 'ADMIN'
  const { data, error, isFetching, refetch } = useGetCareerProfileQuery(undefined, {
    skip: isAdmin,
  })
  const location = useLocation()
  if (isAdmin || data) return <Outlet />
  if (error && !isFetching && isNotFound(error)) {
    const from = location.pathname + location.search + location.hash
    return <Navigate to={paths.onboarding} replace state={{ from }} />
  }
  if (error) {
    return (
      <FocusedFrame>
        <RetryAlert message={t.error} retrying={isFetching} onRetry={() => void refetch()} />
      </FocusedFrame>
    )
  }
  return (
    <FocusedFrame>
      <PageSkeleton label={t.loading} />
    </FocusedFrame>
  )
}
