import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { appTexts } from '@/app/texts'
import type { ThemePreference } from '@/app/theme'
import { useTheme } from '@/app/useTheme'
import { cn } from '@/lib/utils'

const ICONS = { light: Sun, dark: Moon, system: Monitor } as const
const PREFERENCES = ['light', 'dark', 'system'] as const
const t = appTexts.theme

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.label(t.current[preference])}>
          <span className="relative grid size-4 place-items-center" aria-hidden>
            {PREFERENCES.map((option) => {
              const OptionIcon = ICONS[option]
              const active = option === preference
              return (
                <OptionIcon
                  key={option}
                  data-active={active}
                  className={cn(
                    'absolute size-4 transition-[rotate,scale,opacity] duration-300 ease-[cubic-bezier(.3,1.3,.5,1)] motion-reduce:transition-none',
                    active ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
                  )}
                />
              )
            })}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => setPreference(value as ThemePreference)}
        >
          {(Object.keys(t.options) as ThemePreference[]).map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {t.options[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
