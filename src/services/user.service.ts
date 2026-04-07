import { get, patch, post, put } from '../api/http-client'
import type { UserRole } from './auth.service'

export type UserStatus = 'active' | 'inactive' | 'locked'

export interface AdminUser {
  id: number
  full_name: string
  email: string
  phone: string | null
  department_id: number | null
  position_id: number | null
  role: UserRole
  status: UserStatus
  must_change_password: boolean
  updated_at: string | null
}

interface ApiEnvelope<T> {
  data: T
  message: string
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export interface UserListQuery {
  keyword?: string
  status?: '' | UserStatus
  department_id?: number | null
  position_id?: number | null
  page?: number
  per_page?: number
}

export interface CreateUserPayload {
  full_name: string
  email: string
  phone?: string | null
  department_id?: number | null
  position_id?: number | null
  role?: UserRole
  status?: UserStatus
  send_invitation_email?: boolean
}

export interface UpdateUserPayload {
  full_name?: string
  email?: string
  phone?: string | null
  department_id?: number | null
  position_id?: number | null
  status?: UserStatus
}

export const userService = {
  list(token: string, query: UserListQuery = {}) {
    return get<ApiEnvelope<PaginatedResponse<AdminUser>>>('/admin/users', {
      token,
      query: {
        keyword: query.keyword || undefined,
        status: query.status || undefined,
        department_id: query.department_id ?? undefined,
        position_id: query.position_id ?? undefined,
        page: query.page,
        per_page: query.per_page,
      },
    })
  },

  getDetail(token: string, id: number) {
    return get<ApiEnvelope<AdminUser>>(`/admin/users/${id}`, { token })
  },

  create(token: string, payload: CreateUserPayload) {
    return post<ApiEnvelope<AdminUser & { onboarding?: Record<string, unknown> }>>('/admin/users', payload, {
      token,
    })
  },

  update(token: string, id: number, payload: UpdateUserPayload) {
    return put<ApiEnvelope<AdminUser>>(`/admin/users/${id}`, payload, { token })
  },

  updateStatus(token: string, id: number, status: UserStatus) {
    return patch<ApiEnvelope<{ id: number; status: UserStatus }>>(`/admin/users/${id}/status`, { status }, { token })
  },

  resetPassword(token: string, id: number, payload: { new_password?: string; send_invitation_email?: boolean } = {}) {
    return post<ApiEnvelope<{ reset: boolean; must_change_password: boolean }>>(
      `/admin/users/${id}/reset-password`,
      payload,
      { token },
    )
  },
}
