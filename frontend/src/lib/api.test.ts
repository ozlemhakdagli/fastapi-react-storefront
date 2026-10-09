import { api, ApiError, setUnauthorizedHandler } from '@/lib/api'

function jsonResponse(status: number, body?: unknown): Response {
  if (body === undefined) return new Response(null, { status })
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls.at(-1)!
  return { url: url as string, init: (init ?? {}) as RequestInit }
}

describe('api', () => {
  const fetchMock = vi.fn()
  const redirect = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    redirect.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    setUnauthorizedHandler(redirect)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds the query string and skips undefined params', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { items: [] }))
    await api.get('/products', { page: 2, q: 'çelik şarj', category_id: undefined, is_new: true })
    const { url } = lastCall(fetchMock)
    expect(url.startsWith('/api/products?')).toBe(true)
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('page')).toBe('2')
    expect(params.get('q')).toBe('çelik şarj')
    expect(params.get('is_new')).toBe('true')
    expect(params.has('category_id')).toBe(false)
  })

  it('sends the bearer token when one is stored', async () => {
    localStorage.setItem('ecommerce.token', 'abc123')
    fetchMock.mockResolvedValue(jsonResponse(200, {}))
    await api.get('/auth/me')
    const { init } = lastCall(fetchMock)
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer abc123')
  })

  it('sends no Authorization header without a token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}))
    await api.get('/site')
    const { init } = lastCall(fetchMock)
    expect(new Headers(init.headers).has('Authorization')).toBe(false)
  })

  it('sends JSON bodies with a content type', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))
    await api.post('/contact', { name: 'Ayşe' })
    const { init } = lastCall(fetchMock)
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ name: 'Ayşe' }))
  })

  it('uploads FormData without forcing a content type', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))
    const form = new FormData()
    form.append('file', new Blob(['x']), 'a.png')
    await api.upload('/admin/products/1/images', form)
    const { init } = lastCall(fetchMock)
    expect(init.method).toBe('POST')
    expect(init.body).toBe(form)
    expect(new Headers(init.headers).has('Content-Type')).toBe(false)
  })

  it('turns a JSON error body into an ApiError with code and extra', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { detail: 'insufficient_stock', product_id: 3 }),
    )
    const error = await api.post('/orders', {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError
    expect(apiError.status).toBe(409)
    expect(apiError.code).toBe('insufficient_stock')
    expect(apiError.extra.product_id).toBe(3)
  })

  it('maps FastAPI validation errors (detail is a list) to validation_error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(422, { detail: [{ loc: ['body'], msg: 'bad' }] }))
    const error = (await api.post('/auth/register', {}).catch((e: unknown) => e)) as ApiError
    expect(error.status).toBe(422)
    expect(error.code).toBe('validation_error')
  })

  it('maps a failed fetch to a network ApiError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = (await api.get('/site').catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('network')
  })

  it('maps a non-JSON error body to unknown', async () => {
    fetchMock.mockResolvedValue(new Response('<html>oops</html>', { status: 502 }))
    const error = (await api.get('/site').catch((e: unknown) => e)) as ApiError
    expect(error.status).toBe(502)
    expect(error.code).toBe('unknown')
  })

  it('resolves a 204 to undefined', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204))
    await expect(api.delete('/comments/1')).resolves.toBeUndefined()
  })

  it('clears the token and redirects on a 401 of an authenticated call', async () => {
    localStorage.setItem('ecommerce.token', 'stale')
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: 'unauthorized' }))
    await api.get('/cart').catch(() => undefined)
    expect(localStorage.getItem('ecommerce.token')).toBeNull()
    expect(redirect).toHaveBeenCalledTimes(1)
  })

  it('redirects on a 401 of a password change from an ended session', async () => {
    localStorage.setItem('ecommerce.token', 'ended')
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: 'unauthorized' }))
    await api.post('/auth/change-password', {}).catch(() => undefined)
    expect(localStorage.getItem('ecommerce.token')).toBeNull()
    expect(redirect).toHaveBeenCalledTimes(1)
  })

  it('does not redirect on a 401 from the startup session check', async () => {
    localStorage.setItem('ecommerce.token', 'stale')
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: 'unauthorized' }))
    await api.get('/auth/me').catch(() => undefined)
    expect(localStorage.getItem('ecommerce.token')).toBeNull()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('does not touch anything on a 401 when no token was sent', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: 'invalid_credentials' }))
    await api.post('/auth/login', {}).catch(() => undefined)
    expect(redirect).not.toHaveBeenCalled()
  })
})
