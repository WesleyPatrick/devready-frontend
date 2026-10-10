import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useGetAuthProvidersQuery } from './api'
import { authTexts } from './texts'
import type { SocialProvider } from './types'

const t = authTexts.social

const LINKS: Array<{ provider: SocialProvider; href: string; label: string }> = [
  { provider: 'GOOGLE', href: '/oauth2/authorization/google', label: t.google },
  { provider: 'GITHUB', href: '/oauth2/authorization/github', label: t.github },
]

export function SocialButtons() {
  const { data } = useGetAuthProvidersQuery()
  const links = LINKS.filter((link) => data?.providers.includes(link.provider))
  if (links.length === 0) return null
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        <span>{t.or}</span>
        <Separator className="flex-1" />
      </div>
      <div className="grid gap-2">
        {links.map((link) => (
          <Button key={link.provider} asChild variant="outline">
            <a href={link.href}>{link.label}</a>
          </Button>
        ))}
      </div>
    </div>
  )
}
