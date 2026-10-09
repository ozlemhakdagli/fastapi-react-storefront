import { ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'

describe('i18n', () => {
  it('returns the Turkish string for a known key', () => {
    expect(t('common.save')).toBe('Kaydet')
  })

  it('returns the key itself when the key is missing', () => {
    expect(t('common.does_not_exist')).toBe('common.does_not_exist')
  })

  it('interpolates {name} style parameters', () => {
    expect(t('common.page_of', { page: 2, pages: 5 })).toBe('Sayfa 2 / 5')
  })

  it('maps an ApiError code to its translated message', () => {
    expect(errorMessage(new ApiError(409, 'email_taken'))).toBe(t('errors.email_taken'))
    expect(t('errors.email_taken')).not.toBe('errors.email_taken')
  })

  it('falls back to errors.unknown for an unknown code', () => {
    expect(errorMessage(new ApiError(500, 'some_new_code'))).toBe(t('errors.unknown'))
  })

  it('falls back to errors.unknown for non-ApiError values', () => {
    expect(errorMessage(new Error('boom'))).toBe(t('errors.unknown'))
    expect(errorMessage('boom')).toBe(t('errors.unknown'))
  })

  it('has a translated message for every error code of the contract', () => {
    const codes = [
      'unauthorized', 'invalid_credentials', 'forbidden', 'not_found', 'email_taken',
      'sku_taken', 'name_taken', 'has_dependencies', 'last_admin', 'insufficient_stock',
      'product_unavailable', 'invalid_status_transition', 'empty_cart', 'wrong_password',
      'invalid_reference', 'file_too_large', 'payload_too_large', 'product_changed', 'unsupported_media_type',
      'validation_error',
      'network', 'unknown',
    ]
    for (const code of codes) {
      expect(t(`errors.${code}`), code).not.toBe(`errors.${code}`)
    }
  })
})
