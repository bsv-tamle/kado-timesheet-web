import { get, patch, post, put } from '../api/http-client'

export type ProjectStatus = 'active' | 'inactive' | 'archived'

export interface Project {
  id: number
  project_code: string
  project_name: string
  status: ProjectStatus
  billable_flag: boolean
  description: string | null
  start_date?: string | null
  end_date?: string | null
  created_at?: string
  updated_at?: string
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  links: Array<{ url: string | null; label: string; active: boolean }>
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

interface ApiEnvelope<T> {
  data: T
  message: string
}

export interface ProjectListQuery {
  keyword?: string
  status?: '' | ProjectStatus
  billable_flag?: '' | 'true' | 'false'
  page?: number
  per_page?: number
}

export interface SaveProjectPayload {
  project_code: string
  project_name: string
  status: ProjectStatus
  billable_flag: boolean
  description?: string
}

export const projectService = {
  list(token: string, query: ProjectListQuery = {}) {
    return get<ApiEnvelope<PaginatedResponse<Project>>>('/admin/projects', {
      token,
      query: {
        keyword: query.keyword || undefined,
        status: query.status || undefined,
        billable_flag:
          query.billable_flag === '' || query.billable_flag === undefined
            ? undefined
            : query.billable_flag,
        page: query.page,
        per_page: query.per_page,
      },
    })
  },

  getDetail(token: string, id: number) {
    return get<ApiEnvelope<Project>>(`/admin/projects/${id}`, { token })
  },

  create(token: string, payload: SaveProjectPayload) {
    return post<ApiEnvelope<Project>>('/admin/projects', payload, { token })
  },

  update(token: string, id: number, payload: Partial<SaveProjectPayload>) {
    return put<ApiEnvelope<Project>>(`/admin/projects/${id}`, payload, { token })
  },

  updateStatus(token: string, id: number, status: ProjectStatus) {
    return patch<ApiEnvelope<{ id: number; status: ProjectStatus }>>(
      `/admin/projects/${id}/status`,
      { status },
      { token },
    )
  },
}
