import { renderHook, act } from '@testing-library/react'
import { ApiError } from '@/lib/api'
import { errorMessage, getLocale, setLocale, t, useLocale } from '@/lib/i18n'

describe('i18n', () => {
  beforeEach(() => {
    setLocale('tr')
    localStorage.clear()
  })

  it('returns the Turkish string for a known key by default', () => {
    expect(t('common.save')).toBe('Kaydet')
  })

  it('returns the English string when locale is switched to en', () => {
    setLocale('en')
    expect(t('common.save')).toBe('Save')
    expect(t('catalog.hero_title')).toBe('Everything you need in one place')
  })

  it('switches active dictionary and updates localStorage on setLocale', () => {
    expect(getLocale()).toBe('tr')
    expect(t('common.actions')).toBe('İşlemler')

    setLocale('en')
    expect(getLocale()).toBe('en')
    expect(localStorage.getItem('ecommerce.lang')).toBe('en')
    expect(t('common.actions')).toBe('Actions')

    setLocale('tr')
    expect(getLocale()).toBe('tr')
    expect(localStorage.getItem('ecommerce.lang')).toBe('tr')
    expect(t('common.actions')).toBe('İşlemler')
  })

  it('returns the key itself when the key is missing in all dictionaries', () => {
    expect(t('common.does_not_exist')).toBe('common.does_not_exist')
    setLocale('en')
    expect(t('common.does_not_exist')).toBe('common.does_not_exist')
  })

  it('interpolates {name} style parameters in both languages', () => {
    setLocale('tr')
    expect(t('common.page_of', { page: 2, pages: 5 })).toBe('Sayfa 2 / 5')
    expect(t('account.order_number', { id: 123 })).toBe('Sipariş #123')

    setLocale('en')
    expect(t('common.page_of', { page: 2, pages: 5 })).toBe('Page 2 of 5')
    expect(t('account.order_number', { id: 123 })).toBe('Order #123')
  })

  it('maps an ApiError code to its translated message in both languages', () => {
    setLocale('tr')
    expect(errorMessage(new ApiError(409, 'email_taken'))).toBe('Bu e-posta adresi zaten kayıtlı.')

    setLocale('en')
    expect(errorMessage(new ApiError(409, 'email_taken'))).toBe('This email address is already registered.')
  })

  it('falls back to errors.unknown for an unknown code in both languages', () => {
    setLocale('tr')
    expect(errorMessage(new ApiError(500, 'some_new_code'))).toBe('Beklenmeyen bir hata oluştu.')

    setLocale('en')
    expect(errorMessage(new ApiError(500, 'some_new_code'))).toBe('An unexpected error occurred.')
  })

  it('falls back to errors.unknown for non-ApiError values in both languages', () => {
    setLocale('tr')
    expect(errorMessage(new Error('boom'))).toBe('Beklenmeyen bir hata oluştu.')
    expect(errorMessage('boom')).toBe('Beklenmeyen bir hata oluştu.')

    setLocale('en')
    expect(errorMessage(new Error('boom'))).toBe('An unexpected error occurred.')
    expect(errorMessage('boom')).toBe('An unexpected error occurred.')
  })

  it('has a translated message for every error code of the API in both TR and EN', () => {
    const codes = [
      'unauthorized', 'invalid_credentials', 'forbidden', 'not_found', 'email_taken',
      'sku_taken', 'name_taken', 'has_dependencies', 'last_admin', 'insufficient_stock',
      'product_unavailable', 'invalid_status_transition', 'empty_cart', 'wrong_password',
      'invalid_reference', 'file_too_large', 'payload_too_large', 'product_changed', 'unsupported_media_type',
      'validation_error',
      'network', 'unknown',
    ]

    setLocale('tr')
    for (const code of codes) {
      expect(t(`errors.${code}`), `TR code ${code}`).not.toBe(`errors.${code}`)
    }

    setLocale('en')
    for (const code of codes) {
      expect(t(`errors.${code}`), `EN code ${code}`).not.toBe(`errors.${code}`)
    }
  })

  it('updates reactively when used via useLocale hook', () => {
    const { result } = renderHook(() => useLocale())

    expect(result.current.locale).toBe('tr')
    expect(result.current.t('common.save')).toBe('Kaydet')

    act(() => {
      result.current.setLocale('en')
    })

    expect(result.current.locale).toBe('en')
    expect(result.current.t('common.save')).toBe('Save')
  })
})
