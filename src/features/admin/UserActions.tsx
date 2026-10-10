import { useRef } from 'react'
import { Ellipsis } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { adminTexts } from './texts'
import type { AdminUser, RowAction } from './types'

const t = adminTexts

type Props = { user: AdminUser; onChoose: (action: RowAction) => void }

export function UserActions({ user, onChoose }: Props) {
  const chose = useRef(false)
  const choose = (action: RowAction) => {
    chose.current = true
    onChoose(action)
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-user-id={user.id}
          aria-label={t.actionsFor(user.displayName)}
        >
          <Ellipsis aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-auto min-w-44"
        onCloseAutoFocus={(event) => {
          if (chose.current) event.preventDefault()
          chose.current = false
        }}
      >
        <DropdownMenuItem onSelect={() => choose(user.active ? 'deactivate' : 'activate')}>
          {user.active ? t.actions.deactivate : t.actions.activate}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => choose(user.role === 'ADMIN' ? 'demote' : 'promote')}>
          {user.role === 'ADMIN' ? t.actions.demote : t.actions.promote}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => choose('resetPassword')}>
          {t.actions.resetPassword}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
