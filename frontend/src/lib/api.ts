// The only HTTP layer of the frontend. Everything else calls `api.*`.

const TOKEN_KEY = 'ecommerce.token'
const BASE: string = import.meta.env.VITE_API_BASE ?? '/api'

export class ApiError extends Error {
  status: number
  code: string
  extra: Record<string, unknown>

  constructor(status: number, code: string, extra: Record<string, unknown> = {}) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.extra = extra
  }
}

// localStorage can throw (private mode, blocked site data); the app then works without a session.
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

let onUnauthorized: () => void = () => {
  if (window.location.pathname !== '/login') window.location.assign('/login')
}

/** Replace the default "go to /login" reaction to a 401 (used by tests). */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

type Params = Record<string, string | number | boolean | null | undefined>

function buildUrl(path: string, params?: Params): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null) query.set(key, String(value))
  }
  const qs = query.toString()
  return `${BASE}${path}${qs ? `?${qs}` : ''}`
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'detail' in body) {
      const { detail, ...extra } = body as { detail: unknown } & Record<string, unknown>
      if (typeof detail === 'string') return new ApiError(response.status, detail, extra)
      // FastAPI validation errors carry a list in `detail`.
      return new ApiError(response.status, 'validation_error', { errors: detail })
    }
  } catch {
    /* body was not JSON */
  }
  return new ApiError(response.status, 'unknown')
}

interface RequestOptions {
  params?: Params
  body?: unknown
  form?: FormData
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers()
  const token = tokenStore.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body: BodyInit | undefined
  if (options.form) {
    body = options.form // the browser sets the multipart boundary
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.params), { method, headers, body })
  } catch {
    throw new ApiError(0, 'network')
  }

  if (response.status === 401 && token) {
    tokenStore.clear()
    // Login and the startup session check handle their own 401s.
    if (!path.startsWith('/auth/')) onUnauthorized()
  }
  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>('GET', path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, { form }),
}
