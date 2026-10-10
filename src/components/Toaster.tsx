import { Toaster as Sonner } from 'sonner'
import { resolveTheme, systemPrefersDark } from '@/app/theme'
import { appTexts } from '@/app/texts'
import { useTheme } from '@/app/useTheme'

export function Toaster() {
  const { preference } = useTheme()
  return (
    <Sonner
      theme={resolveTheme(preference, systemPrefersDark())}
      position="bottom-right"
      offset={16}
      mobileOffset={{ bottom: 88 }}
      containerAriaLabel={appTexts.toasts}
    />
  )
}
