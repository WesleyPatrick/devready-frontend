import { useState } from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { http, HttpResponse } from 'msw'
import { useOverlayOpen } from '@/lib/motion/overlays'
import { competencyDetail, trackWithProgress } from '@/test/fixtures'
import { server } from '@/test/server'
import { renderWithProviders, storeWithGoal } from '@/test/render'
import { CompetencySheet } from './CompetencySheet'

function Probe() {
  return <p>{useOverlayOpen() ? 'coberto' : 'livre'}</p>
}

function Host({ initial = 'sql-e-modelagem-de-dados' }: { initial?: string }) {
  const [slug, setSlug] = useState<string | null>(initial)
  return (
    <>
      <Probe />
      <CompetencySheet slug={slug} companies={[]} onClose={() => setSlug(null)} />
    </>
  )
}

async function openSheet(initial: string) {
  renderWithProviders(
    <MemoryRouter initialEntries={['/track']}>
      <Routes>
        <Route path="/track" element={<Host initial={initial} />} />
        <Route path="/sessions/:id" element={<p>Lição começou.</p>} />
      </Routes>
    </MemoryRouter>,
    storeWithGoal(),
  )
  const sheet = await screen.findByRole('dialog')
  await within(sheet).findByRole('heading', { level: 3, name: 'Questões' })
  return sheet
}

describe('CompetencySheet', () => {
  it('o painel aberto conta em useOverlayOpen', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MemoryRouter>
        <Host />
      </MemoryRouter>,
      storeWithGoal(),
    )
    await screen.findByRole('dialog')
    expect(screen.getByText('coberto')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByText('livre')).toBeInTheDocument())
  })

  it('mostra os materiais com link que abre em outra aba, tipo, idioma e se é gratuito', async () => {
    const sheet = await openSheet('estruturas-de-dados-e-algoritmos')
    const list = within(sheet).getByRole('list', { name: 'Para estudar' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    const link = within(list).getByRole('link', {
      name: /Projeto de Algoritmos, de Paulo Feofiloff/,
    })
    expect(link).toHaveAttribute('href', 'https://www.ime.usp.br/~pf/algoritmos/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link).toHaveAccessibleName(/abre em outra aba/)
    expect(within(list).getByText('Livro · Português · Gratuito')).toBeInTheDocument()
  })

  it('cada desafio é um link para a página dele, com a situação, as linguagens e a dificuldade', async () => {
    const sheet = await openSheet('estruturas-de-dados-e-algoritmos')
    const list = within(sheet).getByRole('list', { name: 'Desafios de código' })
    const links = within(list).getAllByRole('link')
    expect(links).toHaveLength(4)
    expect(links[0]).toHaveAttribute('href', '/challenges/valid-parentheses')
    expect(links[0]).toHaveTextContent('Parênteses balanceados')
    expect(links[0]).toHaveTextContent('Java · Python · JavaScript')
    expect(within(links[0]).getByText('Não iniciada')).toHaveClass('sr-only')
    expect(within(links[0]).getByText('Fácil')).toBeInTheDocument()
    expect(within(sheet).getByText(/rodar contra os casos de teste/)).toBeInTheDocument()
    expect(within(sheet).queryByText(/próxima etapa/)).not.toBeInTheDocument()
  })

  it('numa competência bloqueada, o desafio aparece apagado, sem link, com o aviso', async () => {
    const detail = competencyDetail('design-de-sistemas', trackWithProgress)!
    server.use(
      http.get('/api/v1/career/track/competencies/design-de-sistemas', () =>
        HttpResponse.json({
          ...detail,
          challenges: [
            {
              slug: 'two-sum',
              title: 'Soma de dois números',
              difficulty: 'EASY',
              languages: ['JAVA'],
              status: 'NOT_STARTED',
            },
          ],
        }),
      ),
    )
    const sheet = await openSheet('design-de-sistemas')
    const list = within(sheet).getByRole('list', { name: 'Desafios de código' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(within(list).queryAllByRole('link')).toHaveLength(0)
    expect(within(list).getByText('Soma de dois números')).toBeInTheDocument()
    expect(
      within(sheet).getByText('Os desafios abrem junto com a competência.'),
    ).toBeInTheDocument()
  })

  it('cada seção sem item diz isso', async () => {
    const sheet = await openSheet('ingles')
    expect(
      within(sheet).getByText('Nenhum material de estudo ligado a esta competência ainda.'),
    ).toBeInTheDocument()
    expect(
      within(sheet).getByText('Nenhuma questão do catálogo ligada a esta competência ainda.'),
    ).toBeInTheDocument()
    expect(
      within(sheet).getByText('Nenhum desafio de código ligado a esta competência ainda.'),
    ).toBeInTheDocument()
  })

  it('diz se a competência é obrigatória ou desejável', async () => {
    const sheet = await openSheet('nuvem')
    expect(within(sheet).getByText('Desejável')).toBeInTheDocument()
  })

  it('o painel não mostra etiqueta de prévia', async () => {
    expect(within(await openSheet('nuvem')).queryByText('Prévia')).not.toBeInTheDocument()
  })

  it('com três questões ou mais, o painel oferece a lição e a lição começa', async () => {
    const user = userEvent.setup()
    const sheet = await openSheet('sql-e-modelagem-de-dados')

    await user.click(within(sheet).getByRole('button', { name: 'Iniciar lição' }))

    expect(await screen.findByText('Lição começou.')).toBeInTheDocument()
  })

  it('com menos de três questões, sem lição', async () => {
    const sheet = await openSheet('apis-rest')
    expect(within(sheet).queryByRole('button', { name: 'Iniciar lição' })).not.toBeInTheDocument()
  })
  it('o item acima de Júnior mostra o nível; o júnior, não', async () => {
    const detail = competencyDetail('sql-e-modelagem-de-dados')!
    server.use(
      http.get('/api/v1/career/track/competencies/:slug', () =>
        HttpResponse.json({
          ...detail,
          questions: [
            ...detail.questions,
            {
              slug: 'backend-pleno-composite-index-order',
              title: 'Ordem das colunas no índice composto',
              difficulty: 'MEDIUM',
              level: 'PLENO',
              status: 'NOT_STARTED',
            },
          ],
        }),
      ),
    )
    const sheet = await openSheet('sql-e-modelagem-de-dados')
    const item = within(sheet).getByRole('button', {
      name: /Ordem das colunas no índice composto/,
    })
    expect(within(item).getByText('Pleno')).toBeInTheDocument()
    expect(item).toHaveAccessibleName(/composto\s*Nível:\s*Pleno\s*Médio/)
    expect(within(item).getByText('Nível:')).toHaveClass('sr-only')
    expect(within(sheet).queryByText('Júnior')).not.toBeInTheDocument()
  })
})
