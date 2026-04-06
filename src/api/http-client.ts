export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
  headers?: Record<string, string>
  token?: string
}

const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, headers = {}, token } = options
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${API_BASE_URL}${normalizedPath}${toQueryString(query)}`

  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = (data && typeof data === 'object' && 'message' in data && (data as { message?: string }).message) || 'Request failed'
    throw new ApiError(message || 'Request failed', response.status, data)
  }

  return data as T
}

export function post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
  return request<T>(path, { ...options, method: 'POST', body })
}

export function get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
  return request<T>(path, { ...options, method: 'GET' })
}

export function put<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
  return request<T>(path, { ...options, method: 'PUT', body })
}

export function patch<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
  return request<T>(path, { ...options, method: 'PATCH', body })
}

export function del<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
  return request<T>(path, { ...options, method: 'DELETE' })
}

function toQueryString(query?: RequestOptions['query']): string {
  if (!query) return ''

  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    params.append(key, String(value))
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}
