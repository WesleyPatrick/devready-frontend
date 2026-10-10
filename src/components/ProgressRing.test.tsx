import { render, screen } from '@testing-library/react'
import { ProgressRing } from './ProgressRing'

it('soma os segmentos no aria-valuenow e desenha um arco por segmento com valor', () => {
  const { container } = render(
    <ProgressRing
      label="3 de 8 concluídas"
      total={8}
      segments={[
        { value: 2, className: 'stroke-easy' },
        { value: 1, className: 'stroke-medium' },
        { value: 0, className: 'stroke-hard' },
      ]}
    >
      3
    </ProgressRing>,
  )
  const ring = screen.getByRole('progressbar', { name: '3 de 8 concluídas' })
  expect(ring).toHaveAttribute('aria-valuenow', '3')
  expect(ring).toHaveAttribute('aria-valuemax', '8')
  expect(container.querySelectorAll('circle')).toHaveLength(3)
  const easy = container.querySelector('circle.stroke-easy')!
  const circumference = 2 * Math.PI * ((92 - 8) / 2)
  expect(Number(easy.getAttribute('stroke-dasharray')?.split(' ')[0])).toBeCloseTo(
    (circumference * 2) / 8,
  )
  const medium = container.querySelector('circle.stroke-medium')!
  expect(Number(medium.getAttribute('stroke-dashoffset'))).toBeCloseTo(-(circumference * 2) / 8)
})

it('sem nada concluído, só o trilho', () => {
  const { container } = render(
    <ProgressRing label="0 de 8" total={8} segments={[{ value: 0, className: 'stroke-easy' }]} />,
  )
  expect(container.querySelectorAll('circle')).toHaveLength(1)
})
