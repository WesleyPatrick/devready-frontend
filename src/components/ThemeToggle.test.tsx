import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'
import { resetThemeForTests, THEME_STORAGE_KEY } from '@/app/theme'

describe('ThemeToggle', () => {
  afterEach(() => {
    resetThemeForTests()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = ''
  })

  it('lista Escuro, Claro e Sistema, nessa ordem', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await user.click(screen.getByRole('button', { name: 'Tema: escuro' }))
    expect(screen.getAllByRole('menuitemradio').map((item) => item.textContent)).toEqual([
      'Escuro',
      'Claro',
      'Sistema',
    ])
  })

  it('troca para claro, guarda a escolha e marca a opção', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Tema: escuro' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Claro' }))

    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(screen.getByRole('button', { name: 'Tema: claro' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tema: claro' }))
    expect(screen.getByRole('menuitemradio', { name: 'Claro' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('menuitemradio', { name: 'Escuro' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('dois seletores na mesma tela mostram a mesma escolha', async () => {
    const user = userEvent.setup()
    render(
      <>
        <ThemeToggle />
        <ThemeToggle />
      </>,
    )

    const [first] = screen.getAllByRole('button', { name: 'Tema: escuro' })
    await user.click(first)
    await user.click(screen.getByRole('menuitemradio', { name: 'Claro' }))

    expect(await screen.findAllByRole('button', { name: 'Tema: claro' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Tema: escuro' })).not.toBeInTheDocument()
  })

  it('o primeiro seletor montado relê a escolha gravada enquanto nenhum estava na tela', () => {
    render(<ThemeToggle />).unmount()
    localStorage.setItem(THEME_STORAGE_KEY, 'light')

    render(<ThemeToggle />)

    expect(document.documentElement).not.toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Tema: claro' })).toBeInTheDocument()
  })

  it('aplica a troca feita em outra aba', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: 'Tema: escuro' })).toBeInTheDocument()

    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light')
      window.dispatchEvent(
        new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'light' }),
      )
    })

    expect(document.documentElement).not.toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Tema: claro' })).toBeInTheDocument()
  })

  it('os três ícones ficam no botão, e só o da escolha aparece', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'Tema: escuro' })
    expect(button.querySelectorAll('svg')).toHaveLength(3)
    expect(button.querySelector('svg[data-active="true"]')).toHaveClass('lucide-moon')
    expect(button.querySelectorAll('svg[data-active="false"]')).toHaveLength(2)
  })
})
