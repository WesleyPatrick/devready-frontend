import { Outlet } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { PublicLayout } from '@/app/layout/PublicLayout'
import { selectCurrentUser } from '@/features/auth/slice'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function RequireAdmin() {
  const user = useAppSelector(selectCurrentUser)
  if (user?.role !== 'ADMIN') {
    return (
      <PublicLayout>
        <NotFoundPage />
      </PublicLayout>
    )
  }
  return <Outlet />
}
