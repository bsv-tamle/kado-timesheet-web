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
  storage: Storage
}

const TOKEN_KEY = 'kado_access_token'
const USER_KEY = 'kado_user'

export const authService = {
  login(payload: LoginRequest) {
    return post<LoginResponse>('/auth/login', payload)
  },

  saveSession(token: string, user: AuthUser, rememberMe: boolean) {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, token)
    storage.setItem(USER_KEY, JSON.stringify(user))

    // Clear stale auth in the opposite storage
    if (rememberMe) {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
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
    if (!token || !rawUser) return null

    try {
      const user = JSON.parse(rawUser) as AuthUser
      if (!user?.role) return null
      return { token, user, storage }
    } catch {
      return null
    }
  },
}
