import { Navigate, Outlet, useMatch } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { homeFor, paths } from '@/app/paths'
import { selectCurrentUser } from '@/features/auth/slice'

export function RequirePasswordChange() {
  const user = useAppSelector(selectCurrentUser)
  const onChangePage = useMatch(paths.changePassword) !== null
  if (user?.mustChangePassword && !onChangePage)
    return <Navigate to={paths.changePassword} replace />
  if (!user?.mustChangePassword && onChangePage) return <Navigate to={homeFor(user)} replace />
  return <Outlet />
}
