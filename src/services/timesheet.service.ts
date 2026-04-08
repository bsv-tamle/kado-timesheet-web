import { del, get, post, put } from '../api/http-client'

interface ApiEnvelope<T> {
  data: T
  message: string
}

export interface TimesheetDetail {
  detail_id: number
  project_id: number
  project_code: string
  project_name: string
  hours_worked: number
  note: string | null
}

export interface TimesheetEntry {
  entry_id: number
  work_date: string
  total_hours: number
  details: TimesheetDetail[]
}

export interface TimesheetListData {
  month: string
  entries: TimesheetEntry[]
  summary: {
    total_hours_month: number
  }
}

export interface MyProject {
  id: number
  project_code: string
  project_name: string
  status: 'active' | 'inactive' | 'archived'
}

export interface SaveTimesheetDetailInput {
  project_id: number
  hours_worked: number
  note?: string
}

export interface SaveTimesheetPayload {
  work_date: string
  details: SaveTimesheetDetailInput[]
}

export interface TimesheetCreateResult {
  entry_id: number
  work_date: string
  total_hours: number
  created_detail_count: number
}

export interface TimesheetUpdateResult {
  entry_id: number
  updated_detail_count: number
}

export interface TimesheetDeleteDetailResult {
  entry_id: number
  entry_deleted: boolean
  remaining_total_hours: number
}

export const timesheetService = {
  myProjects(token: string) {
    return get<ApiEnvelope<MyProject[]>>('/my-projects', { token })
  },

  list(token: string, month: string) {
    return get<ApiEnvelope<TimesheetListData>>('/timesheets', {
      token,
      query: { month },
    })
  },

  create(token: string, payload: SaveTimesheetPayload) {
    return post<ApiEnvelope<TimesheetCreateResult>>('/timesheets', payload, { token })
  },

  update(token: string, entryId: number, payload: SaveTimesheetPayload) {
    return put<ApiEnvelope<TimesheetUpdateResult>>(`/timesheets/${entryId}`, payload, { token })
  },

  deleteDetail(token: string, detailId: number) {
    return del<ApiEnvelope<TimesheetDeleteDetailResult>>(`/timesheets/details/${detailId}`, { token })
  },
}
