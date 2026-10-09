import { screen } from '@testing-library/react'
import AdminLayout from '@/layouts/AdminLayout'
import { renderWithProviders, testAdmin } from '@/test/utils'

// The accessible name of each section link (its Turkish text) and the path that it leads to.
const SECTIONS: [name: string, path: string][] = [
  ['Gösterge Paneli', '/admin'],
  ['Ürünler', '/admin/products'],
  ['Kategoriler', '/admin/categories'],
  ['Markalar', '/admin/brands'],
  ['Siparişler', '/admin/orders'],
  ['Kullanıcılar', '/admin/users'],
  ['Mesajlar', '/admin/messages'],
  ['Yorumlar', '/admin/comments'],
  ['Site Ayarları', '/admin/settings'],
]

function renderLayout(route: string) {
  renderWithProviders(<AdminLayout />, { route, user: testAdmin })
}

describe('AdminLayout', () => {
  it('gives every section link its Turkish name and path', () => {
    renderLayout('/admin')
    for (const [name, path] of SECTIONS) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', path)
    }
  })

  it('keeps the icons out of the accessible names', () => {
    renderLayout('/admin')
    for (const [name] of SECTIONS) {
      const icon = screen.getByRole('link', { name }).querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('links back to the store', () => {
    renderLayout('/admin')
    expect(screen.getByRole('link', { name: 'Mağazaya dön' })).toHaveAttribute('href', '/')
  })

  it('marks the section that is open', () => {
    renderLayout('/admin/products')
    expect(screen.getByRole('link', { name: 'Ürünler' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Gösterge Paneli' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
