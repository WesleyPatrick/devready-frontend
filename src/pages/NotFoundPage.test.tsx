import { act, screen } from '@testing-library/react'
import { setReducedMotionForTests } from '@/lib/motion/reducedMotion'
import { anonymousStore, renderRoute } from '@/test/render'

it('título, texto e botão continuam como texto normal; o terminal é decorativo', async () => {
  renderRoute('/caminho-que-nao-existe', { store: anonymousStore() })
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ir para o início' })).toHaveAttribute('href', '/')
  const terminal = document.querySelector('[data-slot="terminal"]')!
  expect(terminal).toHaveAttribute('aria-hidden', 'true')
  expect(terminal).toHaveTextContent('GET /caminho-que-nao-existe')
  expect(terminal).toHaveTextContent('404 Not Found')
})

it('caminho longo é cortado com reticências', async () => {
  renderRoute(`/${'a'.repeat(80)}`, { store: anonymousStore() })
  await screen.findByRole('heading', { level: 1 })
  const terminal = document.querySelector('[data-slot="terminal"]')!
  expect(terminal.textContent).toContain('…')
  expect(terminal.textContent).not.toContain('a'.repeat(60))
})

it('com movimento, o terminal digita aos poucos', async () => {
  setReducedMotionForTests(false)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    renderRoute('/x', { store: anonymousStore() })
    const terminal = document.querySelector('[data-slot="terminal"]')!
    expect(terminal).toBeInTheDocument()
    expect(terminal).not.toHaveTextContent('404 Not Found')
    for (let step = 0; step < 100; step++) {
      await act(() => vi.advanceTimersByTimeAsync(40))
    }
    expect(terminal).toHaveTextContent('404 Not Found')
  } finally {
    vi.useRealTimers()
  }
})

it('com movimento, a digitação recomeça quando o caminho muda', async () => {
  setReducedMotionForTests(false)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  const terminal = () => document.querySelector('[data-slot="terminal"]')!
  const typeAll = async () => {
    for (let step = 0; step < 100; step++) {
      await act(() => vi.advanceTimersByTimeAsync(40))
    }
  }
  try {
    const { router } = renderRoute('/x', { store: anonymousStore() })
    expect(terminal()).toBeInTheDocument()
    await typeAll()
    expect(terminal()).toHaveTextContent('404 Not Found')

    await act(() => router.navigate('/y'))
    expect(terminal()).not.toHaveTextContent('404 Not Found')
    await typeAll()
    expect(terminal()).toHaveTextContent('GET /y')
    expect(terminal()).toHaveTextContent('404 Not Found')
  } finally {
    vi.useRealTimers()
  }
})
