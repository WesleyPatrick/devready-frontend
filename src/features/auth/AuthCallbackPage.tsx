import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAppDispatch } from '@/app/hooks'
import { homeFor, paths } from '@/app/paths'
import { useExchangeCodeMutation } from './api'
import { sessionEnded } from './slice'
import { authTexts } from './texts'

export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [exchange] = useExchangeCodeMutation()
  const started = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    if (!started.current) {
      started.current = true
      const fail = () => {
        dispatch(sessionEnded())
        if (mounted.current) navigate(`${paths.login}?error=social`, { replace: true })
      }
      const code = params.get('code')
      if (!code) {
        fail()
      } else {
        exchange({ code }).then((result) => {
          if (result.data) {
            if (mounted.current) navigate(homeFor(result.data.user), { replace: true })
          } else {
            fail()
          }
        })
      }
    }
    return () => {
      mounted.current = false
    }
  }, [params, navigate, exchange, dispatch])

  return (
    <section className="mx-auto max-w-5xl space-y-2 px-4 py-10">
      <h1 className="text-2xl font-semibold">{authTexts.callback.title}</h1>
      <p className="text-muted-foreground">{authTexts.callback.body}</p>
    </section>
  )
}
