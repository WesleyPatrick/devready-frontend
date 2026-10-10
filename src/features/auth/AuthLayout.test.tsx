import { render, screen, within } from '@testing-library/react'
import { AuthLayout } from './AuthLayout'
import { brandPointIcons } from './brandIcons'
import { authTexts } from './texts'

describe('AuthLayout', () => {
  it('mostra o painel da marca e o conteúdo', () => {
    render(
      <AuthLayout>
        <p>formulário</p>
      </AuthLayout>,
    )

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    const panel = screen.getByRole('region', { name: authTexts.brandPanel.title })
    expect(
      within(panel).getByRole('heading', { level: 2, name: authTexts.brandPanel.title }),
    ).toBeInTheDocument()
    expect(within(panel).getAllByRole('listitem')).toHaveLength(3)
    expect(within(panel).queryByText(/dados de exemplo|por enquanto/i)).not.toBeInTheDocument()
    expect(within(panel).getByText(/desafios de código rodados de verdade/i)).toBeInTheDocument()
    expect(within(panel).getByText(/simulações cronometradas com nota/i)).toBeInTheDocument()
    expect(within(panel).queryByText(/ainda vem/i)).not.toBeInTheDocument()
    expect(within(panel).getByText(/calculados a partir das suas respostas/i)).toBeInTheDocument()
    expect(screen.getByText('formulário')).toBeInTheDocument()
  })

  it('tem um ícone para cada ponto do painel', () => {
    expect(brandPointIcons).toHaveLength(authTexts.brandPanel.points.length)
  })
})
