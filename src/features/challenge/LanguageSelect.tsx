import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { challengeTexts } from './texts'
import type { ChallengeLanguage, ChallengeLanguageInfo } from './types'

export function LanguageSelect({
  languages,
  value,
  onChange,
}: {
  languages: ChallengeLanguageInfo[]
  value: ChallengeLanguage
  onChange: (language: ChallengeLanguage) => void
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as ChallengeLanguage)}>
      <SelectTrigger size="sm" aria-label={challengeTexts.toolbar.language} className="min-w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((l) => (
          <SelectItem key={l.language} value={l.language}>
            {l.runtime}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
