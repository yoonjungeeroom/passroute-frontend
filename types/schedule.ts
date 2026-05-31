export type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED"

export interface Schedule {
  id: number
  title: string
  companyName: string
  jobPosition: string
  interviewDate: string // ISO datetime string
  location: string | null
  memo: string | null
  status: ScheduleStatus
  createdAt: string
  updatedAt: string
}

export interface ScheduleCalendarResponse {
  year: number
  month: number
  schedules: Schedule[]
}

export interface ScheduleCreateRequest {
  title: string
  companyName: string
  jobPosition: string
  interviewDate: string // ISO datetime string
  location?: string
  memo?: string
}

export interface ScheduleUpdateRequest {
  title: string
  companyName: string
  jobPosition: string
  interviewDate: string // ISO datetime string
  location?: string
  memo?: string
}

export interface ScheduleStatusUpdateRequest {
  status: ScheduleStatus
}
