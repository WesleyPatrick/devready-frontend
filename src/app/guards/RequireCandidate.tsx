import { Navigate, Outlet } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { paths } from '@/app/paths'
import { selectCurrentUser } from '@/features/auth/slice'

export function RequireCandidate() {
  const user = useAppSelector(selectCurrentUser)
  if (user?.role === 'ADMIN') return <Navigate to={paths.adminUsers} replace />
  return <Outlet />
}
