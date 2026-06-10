import { apiFetch, getAuthHeaders } from "./client"
import type { InterviewReportResponse, DebateReportResponse, SelfIntroReportResponse } from "@/types/report"

export interface ReportListItem {
  reportType: string
  domainId: number
  interviewType: string
  companyName: string
  jobPosition: string
  date: string
  totalScore: number
  feedbackPreview: string
  selfIntroId: number | null
}

export interface ReportListResponse {
  items: ReportListItem[]
  page: number
  size: number
  total: number
}

export async function getReportList(params?: {
  type?: "all" | "technical" | "personality" | "debate"
  page?: number
  size?: number
  q?: string
  resumeId?: number
}): Promise<ReportListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.type) searchParams.set("type", params.type)
  if (params?.page !== undefined) searchParams.set("page", String(params.page))
  if (params?.size !== undefined) searchParams.set("size", String(params.size))
  if (params?.q) searchParams.set("q", params.q)
  if (params?.resumeId !== undefined) searchParams.set("resumeId", String(params.resumeId))

  const query = searchParams.toString()
  return apiFetch<ReportListResponse>(
    `/reports${query ? `?${query}` : ""}`,
    { method: "GET" },
    "리포트 목록 조회에 실패했습니다"
  )
}

// 면접 리포트(세션) 삭제 — soft delete. 성공 200(Void), 권한 없음 403 / 없음 404는 ApiError로 throw.
export async function deleteInterviewReport(sessionId: number): Promise<void> {
  return apiFetch<void>(
    `/reports/interview/${sessionId}`,
    { method: "DELETE" },
    "리포트 삭제에 실패했습니다"
  )
}

// 토론 리포트(세션) 삭제 — soft delete. 면접과 동일 계약.
export async function deleteDebateReport(sessionId: number): Promise<void> {
  return apiFetch<void>(
    `/reports/debate/${sessionId}`,
    { method: "DELETE" },
    "리포트 삭제에 실패했습니다"
  )
}

// 자소서에 연결된 면접 세션들의 집계 리포트. 응시 이력 0건이어도 200 + 빈(totalSessions:0) 응답.
export async function getSelfIntroReport(selfIntroId: number): Promise<SelfIntroReportResponse> {
  return apiFetch<SelfIntroReportResponse>(
    `/reports/self-intro/${selfIntroId}`,
    { method: "GET" },
    "자소서 리포트 조회에 실패했습니다"
  )
}

export async function getInterviewReport(sessionId: number): Promise<InterviewReportResponse | null> {
  const response = await fetch(`/reports/interview/${sessionId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (response.status === 202) return null // 아직 생성 중
  if (!response.ok) throw new Error("리포트 조회에 실패했습니다")

  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("리포트 조회에 실패했습니다")
  }

  const result = await response.json()
  return result.data
}

export async function getDebateReport(sessionId: number): Promise<DebateReportResponse | null> {
  const response = await fetch(`/reports/debate/${sessionId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (response.status === 202) return null
  if (!response.ok) throw new Error("토론 리포트 조회에 실패했습니다")

  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("토론 리포트 조회에 실패했습니다")
  }

  const result = await response.json()
  const data = result.data
  if (!data) return null

  // 백엔드가 turnFeedback 내부 필드를 snake_case(round_type/weighted_score)로 내려보내는 경우 대비.
  // 바깥은 camelCase인데 nested만 snake로 오는 불일치가 있어, camel/snake 양쪽 모두 수용해 정규화한다.
  return {
    ...data,
    turnFeedback: Array.isArray(data.turnFeedback)
      ? data.turnFeedback.map((tf: Record<string, unknown>) => ({
          roundType: (tf.roundType ?? tf.round_type ?? "") as string,
          weightedScore: (tf.weightedScore ?? tf.weighted_score) as number,
          feedback: (tf.feedback ?? "") as string,
        }))
      : [],
  }
}
