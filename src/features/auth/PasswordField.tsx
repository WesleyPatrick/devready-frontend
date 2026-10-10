import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authTexts } from './texts'

export const PasswordField = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? 'text' : 'password'} className="pr-10" {...props} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
          aria-label={visible ? authTexts.password.hide : authTexts.password.show}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    )
  },
)
