import { render, screen } from '@testing-library/react'
import { RatingStars } from '@/components/RatingStars'

describe('RatingStars', () => {
  it('names the average with a decimal comma and the count', () => {
    render(<RatingStars value={4.3} count={12} />)
    expect(screen.getByRole('img', { name: '5 üzerinden 4,3 puan, 12 değerlendirme' })).toBeInTheDocument()
    expect(screen.getByText('4,3 (12)')).toBeInTheDocument()
  })

  it('fills the stars up to the rounded value', () => {
    const { container } = render(<RatingStars value={4.3} count={12} />)
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-filled="false"]')).toHaveLength(1)
  })

  it('fills all five stars for a perfect average', () => {
    const { container } = render(<RatingStars value={5} count={1} />)
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(5)
  })

  it('labels a rating that has no count', () => {
    render(<RatingStars value={4} />)
    expect(screen.getByRole('img', { name: '5 üzerinden 4,0 puan' })).toBeInTheDocument()
  })

  it('says that there is no rating yet, without stars', () => {
    const { container } = render(<RatingStars value={null} />)
    expect(screen.getByText('Henüz puan yok')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('[data-filled]')).toBeNull()
  })
})
