import { get, post } from '../api/http-client'

interface ApiEnvelope<T> {
  data: T
  message: string
}

export interface AssignedProject {
  id: number
  project_code: string
  project_name: string
  status: 'active' | 'inactive' | 'archived'
}

export interface AssignmentByEmployeeResponse {
  employee_id: number
  assigned_projects: AssignedProject[]
}

export interface AssignPayload {
  employee_id: number
  project_ids: number[]
}

export interface AssignResult {
  assigned_count: number
  skipped_count: number
  skipped_project_ids: number[]
}

export interface UnassignResult {
  unassigned_count: number
}

export const assignmentService = {
  getByEmployee(token: string, employeeId: number) {
    return get<ApiEnvelope<AssignmentByEmployeeResponse>>('/admin/employee-projects', {
      token,
      query: { employee_id: employeeId },
    })
  },

  assign(token: string, payload: AssignPayload) {
    return post<ApiEnvelope<AssignResult>>('/admin/employee-projects/assign', payload, { token })
  },

  unassign(token: string, payload: AssignPayload) {
    return post<ApiEnvelope<UnassignResult>>('/admin/employee-projects/unassign', payload, { token })
  },
}
