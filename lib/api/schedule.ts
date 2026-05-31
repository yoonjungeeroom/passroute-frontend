import { apiFetch } from "./client"
import type {
  Schedule,
  ScheduleCalendarResponse,
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
  ScheduleStatusUpdateRequest,
} from "@/types/schedule"

export async function createSchedule(data: ScheduleCreateRequest): Promise<Schedule> {
  return apiFetch<Schedule>(
    "/api/schedules",
    { method: "POST", body: JSON.stringify(data) },
    "일정 생성에 실패했습니다"
  )
}

export async function getScheduleList(): Promise<Schedule[]> {
  try {
    return await apiFetch<Schedule[]>(
      "/api/schedules",
      { method: "GET" },
      "일정 목록 조회에 실패했습니다"
    )
  } catch {
    return []
  }
}

export async function getScheduleCalendar(year: number, month: number): Promise<ScheduleCalendarResponse> {
  try {
    return await apiFetch<ScheduleCalendarResponse>(
      `/api/schedules/calendar?year=${year}&month=${month}`,
      { method: "GET" },
      "캘린더 조회에 실패했습니다"
    )
  } catch {
    // 데이터 없을 때 404 반환하는 백엔드 처리
    return { year, month, schedules: [] }
  }
}

export async function getScheduleDetail(scheduleId: number): Promise<Schedule> {
  return apiFetch<Schedule>(
    `/api/schedules/${scheduleId}`,
    { method: "GET" },
    "일정 상세 조회에 실패했습니다"
  )
}

export async function updateSchedule(scheduleId: number, data: ScheduleUpdateRequest): Promise<Schedule> {
  return apiFetch<Schedule>(
    `/api/schedules/${scheduleId}`,
    { method: "PUT", body: JSON.stringify(data) },
    "일정 수정에 실패했습니다"
  )
}

export async function deleteSchedule(scheduleId: number): Promise<void> {
  return apiFetch<void>(
    `/api/schedules/${scheduleId}`,
    { method: "DELETE" },
    "일정 삭제에 실패했습니다"
  )
}

export async function updateScheduleStatus(
  scheduleId: number,
  data: ScheduleStatusUpdateRequest
): Promise<Schedule> {
  return apiFetch<Schedule>(
    `/api/schedules/${scheduleId}/status`,
    { method: "PATCH", body: JSON.stringify(data) },
    "상태 변경에 실패했습니다"
  )
}

export async function practiceFromSchedule(scheduleId: number): Promise<{ roomId: number }> {
  return apiFetch<{ roomId: number }>(
    `/api/schedules/${scheduleId}/practice`,
    { method: "POST" },
    "연습 방 생성에 실패했습니다"
  )
}
