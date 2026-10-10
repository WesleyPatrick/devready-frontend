import { useId } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Level } from './api'
import { catalogTexts } from './texts'

type Props = { levels: Level[]; value: Level; onChange: (level: Level) => void }

export function LevelSelect({ levels, value, onChange }: Props) {
  const id = useId()
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{catalogTexts.level}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Level)}>
        <SelectTrigger id={id} className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {levels.map((level) => (
            <SelectItem key={level} value={level}>
              {catalogTexts.levels[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
