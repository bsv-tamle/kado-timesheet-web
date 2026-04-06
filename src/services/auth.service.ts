import { post } from '../api/http-client'

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  full_name: string
  email: string
  role: 'admin' | 'employee'
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

export const authService = {
  login(payload: LoginRequest) {
    return post<LoginResponse>('/auth/login', payload)
  },
}

