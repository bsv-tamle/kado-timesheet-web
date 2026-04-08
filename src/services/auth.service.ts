import { post } from '../api/http-client'

export interface LoginRequest {
  email: string
  password: string
}

export type UserRole = 'admin' | 'employee'

export interface AuthUser {
  id: number
  full_name: string
  email: string
  role: UserRole
  must_change_password: boolean
}

export interface LoginResponse {
  data: {
    access_token: string
    token_type: 'Bearer'
    expires_in: number
    user: AuthUser
  }
  message: string
}

export interface AuthSession {
  token: string
  user: AuthUser
  expiresAt: number
  storage: Storage
}

const TOKEN_KEY = 'kado_access_token'
const USER_KEY = 'kado_user'
const EXPIRES_AT_KEY = 'kado_expires_at'

export const authService = {
  login(payload: LoginRequest) {
    return post<LoginResponse>('/auth/login', payload)
  },

  saveSession(token: string, user: AuthUser, rememberMe: boolean, expiresInSeconds?: number) {
    const storage = rememberMe ? localStorage : sessionStorage
    const parsedExpiresIn = Number(expiresInSeconds)
    const ttlSeconds = Number.isFinite(parsedExpiresIn) && parsedExpiresIn > 0 ? parsedExpiresIn : 10 * 60 * 60
    const expiresAt = Date.now() + ttlSeconds * 1000

    storage.setItem(TOKEN_KEY, token)
    storage.setItem(USER_KEY, JSON.stringify(user))
    storage.setItem(EXPIRES_AT_KEY, String(expiresAt))

    // Clear stale auth in the opposite storage
    if (rememberMe) {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      sessionStorage.removeItem(EXPIRES_AT_KEY)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(EXPIRES_AT_KEY)
    }
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(EXPIRES_AT_KEY)
  },

  getSession(): AuthSession | null {
    return this.getSessionFrom(localStorage) ?? this.getSessionFrom(sessionStorage)
  },

  getHomePathByRole(role: UserRole) {
    return role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'
  },

  getSessionFrom(storage: Storage): AuthSession | null {
    const token = storage.getItem(TOKEN_KEY)
    const rawUser = storage.getItem(USER_KEY)
    const rawExpiresAt = storage.getItem(EXPIRES_AT_KEY)
    if (!token || !rawUser || !rawExpiresAt) return null

    try {
      const user = JSON.parse(rawUser) as AuthUser
      const expiresAt = Number(rawExpiresAt)
      if (!user?.role) return null
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        storage.removeItem(TOKEN_KEY)
        storage.removeItem(USER_KEY)
        storage.removeItem(EXPIRES_AT_KEY)
        return null
      }

      return { token, user, expiresAt, storage }
    } catch {
      return null
    }
  },
}
