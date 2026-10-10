import { useState } from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { cannons } from '@/lib/motion/celebrate'
import { useOverlayOpen } from '@/lib/motion/overlays'
import { setReducedMotionForTests } from '@/lib/motion/reducedMotion'
import { lockExam, optionOf, practiceProblem, practiceQuestion } from '@/test/practice'
import { renderWithProviders, storeWithGoal } from '@/test/render'
import { openSimulation, SIMULATION_QUESTIONS } from '@/test/session'
import { server } from '@/test/server'
import { QuestionDialog } from './QuestionDialog'

vi.mock('@/lib/motion/celebrate', () => ({
  cannons: vi.fn(() => Promise.resolve()),
  burstFrom: vi.fn(() => Promise.resolve()),
}))

const SLUG = 'backend-junior-sql-inner-join'
const FRESH = 'backend-junior-java-checked-exceptions'
const correct = optionOf(SLUG, 'correct').label
const wrong = optionOf(SLUG, 'wrong').label

describe('QuestionDialog', () => {
  it('mostra a questão com competência, dificuldade, tempo e XP, sem etiqueta de prévia', async () => {
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    const dialog = await screen.findByRole('dialog', { name: practiceProblem(SLUG).title })
    expect(dialog).toHaveTextContent('SQL e modelagem de dados')
    expect(dialog).toHaveTextContent('Fácil')
    expect(dialog).toHaveTextContent('2 min')
    expect(dialog).toHaveTextContent('+20 XP')
    expect(dialog).not.toHaveTextContent('Prévia')
    expect(await screen.findByRole('group', { name: 'Alternativas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Responder' })).toBeDisabled()
  })

  it('questão sem competência mostra o resto do cabeçalho', async () => {
    server.use(
      http.get('/api/v1/questions/:slug', () =>
        HttpResponse.json({ ...practiceQuestion(SLUG), competency: null }),
      ),
    )
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    const dialog = await screen.findByRole('dialog', { name: practiceProblem(SLUG).title })
    await screen.findByRole('radio', { name: correct })
    expect(dialog).not.toHaveTextContent('SQL e modelagem de dados')
    expect(dialog).toHaveTextContent('Fácil')
  })

  it('durante o envio, o botão fica com aria-disabled e o foco continua nele', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: wrong }))
    let release = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(
        '/api/v1/questions/:slug/answer',
        async () => {
          await gate
        },
        { once: true },
      ),
    )
    const submit = screen.getByRole('button', { name: 'Responder' })
    await user.click(submit)
    const sending = await screen.findByRole('button', { name: 'Respondendo…' })
    expect(sending).toBe(submit)
    expect(sending).toHaveAttribute('aria-disabled', 'true')
    expect(sending).toHaveFocus()
    release()
    expect(await screen.findByText('Não foi dessa vez.')).toBeInTheDocument()
  })

  it('errar mostra a certa, a sua e a explicação', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: wrong }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByText('Não foi dessa vez.')).toBeInTheDocument()
    expect(screen.getByText(/INNER JOIN devolve só as linhas/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: correct })).toBeDisabled()
    expect(screen.getByText('Resposta certa')).toBeInTheDocument()
    expect(screen.getByText('Sua resposta')).toBeInTheDocument()
  })

  it('acertar uma questão nova mostra o XP ganho', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={FRESH} onClose={() => {}} />, storeWithGoal())
    const dialog = await screen.findByRole('dialog')
    await screen.findByRole('radio', { name: optionOf(FRESH, 'correct').label })
    expect(dialog).not.toHaveTextContent('Você já resolveu')
    await user.click(screen.getByRole('radio', { name: optionOf(FRESH, 'correct').label }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByText('Acertou! +20 XP')).toBeInTheDocument()
  })

  it('acertar uma questão já resolvida não soma XP', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    expect(await screen.findByText(/responder de novo não soma XP/)).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: correct }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByText('Acertou!')).toBeInTheDocument()
  })

  it('Esc fecha', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={onClose} />, storeWithGoal())
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('Esc devolve o foco a quem abriu o diálogo', async () => {
    function Host() {
      const [slug, setSlug] = useState<string | null>(null)
      return (
        <>
          <button onClick={() => setSlug(SLUG)}>Abrir questão</button>
          <QuestionDialog slug={slug} onClose={() => setSlug(null)} />
        </>
      )
    }
    const user = userEvent.setup()
    renderWithProviders(<Host />, storeWithGoal())
    const opener = screen.getByRole('button', { name: 'Abrir questão' })
    await user.click(opener)
    await screen.findByRole('radio', { name: correct })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(opener).toHaveFocus()
  })

  it('tem o botão Fechar em português e nenhum "Close"', async () => {
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await screen.findByRole('radio', { name: correct })
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('depois de responder, a borda segue a cor do resultado e não a de marcado', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: wrong }))
    const label = () => screen.getByRole('radio', { name: wrong }).closest('label')!
    expect(label()).toHaveClass('has-checked:border-primary')
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText('Não foi dessa vez.')
    expect(label()).toHaveClass('border-hard')
    expect(label()).not.toHaveClass('has-checked:border-primary')
  })

  it('o diálogo tem nome enquanto carrega e quando a questão não existe', async () => {
    renderWithProviders(<QuestionDialog slug="nao-existe" onClose={() => {}} />, storeWithGoal())
    expect(screen.getByRole('dialog', { name: 'Carregando questão…' })).toBeInTheDocument()
    expect(
      await screen.findByRole('dialog', { name: 'Não foi possível carregar a questão.' }),
    ).toBeInTheDocument()
  })

  it('o resultado fica numa região aria-live polite', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: wrong }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    const message = await screen.findByText('Não foi dessa vez.')
    expect(message.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite')
  })

  it('trocar a questão com o diálogo aberto zera a escolha', async () => {
    const OTHER = 'backend-junior-sql-index'
    function Host() {
      const [slug, setSlug] = useState(SLUG)
      return (
        <>
          <button onClick={() => setSlug(OTHER)}>Trocar</button>
          <QuestionDialog slug={slug} onClose={() => {}} />
        </>
      )
    }
    const user = userEvent.setup()
    renderWithProviders(<Host />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: wrong }))
    expect(screen.getByRole('radio', { name: wrong })).toBeChecked()
    screen.getByText('Trocar').click()
    await screen.findByRole('radio', { name: optionOf(OTHER, 'wrong').label })
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Responder' })).toBeDisabled()
  })

  it('o botão Fechar depois de responder chama onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={onClose} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: correct }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText('Acertou!')
    const footer = screen.getAllByRole('button', { name: 'Fechar' }).at(-1)!
    expect(within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Fechar' })).toContain(
      footer,
    )
    await user.click(footer)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('questão da simulação aberta', () => {
  it('o 409 da questão mostra o aviso e leva de volta à simulação', async () => {
    const session = openSimulation()
    renderWithProviders(
      <MemoryRouter>
        <QuestionDialog slug={SIMULATION_QUESTIONS[0]} onClose={() => {}} />
      </MemoryRouter>,
      storeWithGoal(),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Questão em prova' })
    expect(dialog).toHaveTextContent('Esta questão está na sua simulação em andamento.')
    expect(within(dialog).getByRole('link', { name: 'Continuar a simulação' })).toHaveAttribute(
      'href',
      `/sessions/${session.id}`,
    )
    expect(screen.queryByRole('group', { name: 'Alternativas' })).not.toBeInTheDocument()
  })

  it('o 409 do envio da resposta também leva de volta à simulação', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter>
        <QuestionDialog slug={SLUG} onClose={() => {}} />
      </MemoryRouter>,
      storeWithGoal(),
    )
    await user.click(await screen.findByRole('radio', { name: wrong }))
    lockExam('sessao-aberta', [SLUG])
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(await screen.findByRole('link', { name: 'Continuar a simulação' })).toHaveAttribute(
      'href',
      '/sessions/sessao-aberta',
    )
  })
})

describe('movimento', () => {
  beforeEach(() => {
    setReducedMotionForTests(false)
    vi.mocked(cannons).mockClear()
  })

  it('acerto: canhões, o bloco pula e o "+XP" sobe', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={FRESH} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: optionOf(FRESH, 'correct').label }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText(/^Acertou!/)
    expect(cannons).toHaveBeenCalledTimes(1)
    const body = screen.getByRole('dialog').querySelector('[data-slot="question-body"]')!
    expect(body).toHaveClass('animate-hop')
    const float = screen.getByRole('dialog').querySelector('[data-slot="xp-float"]')!
    expect(float).toHaveAttribute('aria-hidden', 'true')
    const sparks = float.querySelectorAll<HTMLElement>('[data-slot="spark"]')
    expect(sparks).toHaveLength(6)
    expect(sparks[0].parentElement!.querySelector('svg.lucide-zap')).not.toBeNull()
    for (const spark of sparks) {
      expect(spark).toHaveClass('animate-spark', 'motion-reduce:hidden')
      expect(spark.className).not.toMatch(/translate/)
    }
    expect([...sparks].map((spark) => spark.style.getPropertyValue('--spark-angle'))).toEqual([
      '0deg',
      '60deg',
      '120deg',
      '180deg',
      '240deg',
      '300deg',
    ])
  })

  it('erro: a alternativa escolhida treme e o bloco brilha em rosa, sem canhões', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: wrong }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText('Não foi dessa vez.')
    expect(cannons).not.toHaveBeenCalled()
    const chosen = screen.getByText('Sua resposta').closest('label')!
    expect(chosen).toHaveClass('animate-shake')
    const body = screen.getByRole('dialog').querySelector('[data-slot="question-body"]')!
    expect(body).toHaveClass('animate-glow-hard')
    expect(body).toHaveClass('-m-2', 'p-2')
  })

  it('erro: a certa chega com o verde atrasado', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: wrong }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText('Não foi dessa vez.')
    const right = screen.getByText('Resposta certa').closest('label')!
    expect(right).toHaveClass('delay-[450ms]', 'transition-colors')
  })

  it('acerto: a certa não espera para ficar verde', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: correct }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText(/^Acertou!/)
    const right = screen.getByText('Resposta certa').closest('label')!
    expect(right).not.toHaveClass('delay-[450ms]')
  })

  it('acertar de novo uma questão resolvida: canhões, mas sem "+XP"', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: correct }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText('Acertou!')
    expect(cannons).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog').querySelector('[data-slot="xp-float"]')).toBeNull()
  })

  it('o ícone do resultado aparece com pop: check no acerto, X no erro', async () => {
    const user = userEvent.setup()
    const { unmount } = renderWithProviders(
      <QuestionDialog slug={SLUG} onClose={() => {}} />,
      storeWithGoal(),
    )
    await user.click(await screen.findByRole('radio', { name: correct }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    const message = await screen.findByText('Acertou!')
    const check = message.parentElement!.querySelector('svg.lucide-circle-check')!
    expect(check).toHaveClass('animate-pop')
    unmount()
    renderWithProviders(<QuestionDialog slug={SLUG} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: wrong }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    const miss = await screen.findByText('Não foi dessa vez.')
    expect(miss.parentElement!.querySelector('svg.lucide-circle-x')).toHaveClass('animate-pop')
  })
})

describe('movimento reduzido', () => {
  beforeEach(() => setReducedMotionForTests(true))

  it('com movimento reduzido, sem "+XP" flutuando', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuestionDialog slug={FRESH} onClose={() => {}} />, storeWithGoal())
    await user.click(await screen.findByRole('radio', { name: optionOf(FRESH, 'correct').label }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await screen.findByText(/^Acertou!/)
    expect(screen.getByRole('dialog').querySelector('[data-slot="xp-float"]')).toBeNull()
    expect(screen.getByRole('dialog').querySelectorAll('[data-slot="spark"]')).toHaveLength(0)
  })
})

it('o diálogo aberto conta em useOverlayOpen', async () => {
  function Probe() {
    return <p>{useOverlayOpen() ? 'coberto' : 'livre'}</p>
  }
  function Host() {
    const [slug, setSlug] = useState<string | null>(SLUG)
    return (
      <>
        <Probe />
        <QuestionDialog slug={slug} onClose={() => setSlug(null)} />
      </>
    )
  }
  const user = userEvent.setup()
  renderWithProviders(<Host />, storeWithGoal())
  await screen.findByRole('radio', { name: correct })
  expect(screen.getByText('coberto')).toBeInTheDocument()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.getByText('livre')).toBeInTheDocument())
})
