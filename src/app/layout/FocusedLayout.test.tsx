import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { makeStore } from '@/app/store'
import { sessionStarted } from '@/features/auth/slice'
import { refreshTokenStorage } from '@/lib/refreshTokenStorage'
import { candidate } from '@/test/fixtures'
import { problem } from '@/test/handlers'
import { renderRoute } from '@/test/render'
import { server } from '@/test/server'

describe('FocusedLayout', () => {
  it('no onboarding, o menu da conta tem Sair, que encerra a sessão, e não oferece Perfil', async () => {
    server.use(
      http.get('/api/v1/career/profile', () =>
        problem(404, 'Não encontrado', 'Perfil de carreira ainda não preenchido.'),
      ),
    )
    const store = makeStore()
    store.dispatch(sessionStarted({ accessToken: 'a', user: candidate }))
    refreshTokenStorage.set('refresh-1')
    const user = userEvent.setup()
    const { router } = renderRoute('/onboarding', { store })

    const header = await screen.findByRole('banner')
    await user.click(within(header).getByRole('button', { name: 'Conta de Ana' }))
    const logout = await screen.findByRole('menuitem', { name: 'Sair' })
    expect(screen.queryByRole('menuitem', { name: 'Perfil' })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0)

    await user.click(logout)

    await waitFor(() => expect(store.getState().auth.status).toBe('anonymous'))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(refreshTokenStorage.get()).toBeNull()
    expect(router.state.historyAction).toBe('REPLACE')
  })
})
