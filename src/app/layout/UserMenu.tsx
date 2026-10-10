import { useId } from 'react'
import { LogOut, UserRound, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppSelector } from '@/app/hooks'
import { paths } from '@/app/paths'
import { appTexts } from '@/app/texts'
import type { ThemePreference } from '@/app/theme'
import { useTheme } from '@/app/useTheme'
import { useLogoutMutation } from '@/features/auth/api'
import { selectCurrentUser } from '@/features/auth/slice'

export function UserMenu({
  showProfile = true,
  showTheme = true,
}: {
  showProfile?: boolean
  showTheme?: boolean
}) {
  const user = useAppSelector(selectCurrentUser)
  const [logout] = useLogoutMutation()
  const navigate = useNavigate()
  const { preference, setPreference } = useTheme()
  const themeLabelId = useId()

  if (!user) return null

  async function onLogout() {
    await logout()
    navigate(paths.login, { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-2"
          aria-label={appTexts.nav.account(user.displayName)}
        >
          <Avatar className="size-7" aria-hidden>
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-muted font-mono text-xs">
              {user.displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate xl:inline">{user.displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showTheme && (
          <DropdownMenuGroup className="sm:hidden" aria-labelledby={themeLabelId}>
            <DropdownMenuLabel id={themeLabelId}>{appTexts.nav.themeGroup}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={preference}
              onValueChange={(value) => setPreference(value as ThemePreference)}
            >
              {(Object.keys(appTexts.theme.options) as ThemePreference[]).map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {appTexts.theme.options[option]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
        )}
        {showProfile && (
          <>
            {user.role === 'ADMIN' && (
              <DropdownMenuItem asChild>
                <Link to={paths.adminUsers}>
                  <Users aria-hidden />
                  {appTexts.nav.users}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to={paths.profile}>
                <UserRound aria-hidden />
                {appTexts.nav.profile}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={onLogout}>
          <LogOut aria-hidden />
          {appTexts.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
