import { apiFetch, getAuthHeaders } from "./client"
import type {
  InterviewReportResponse, DebateReportResponse, SelfIntroReportResponse, CsTopicAnalysisResponse,
  DetailedFeedback, FactCheck, IncorrectClaim,
} from "@/types/report"

// ── questionFeedback 신규 필드(detailedFeedback/factCheck) 정규화 ──
// 백엔드가 중첩 객체를 snake_case로 내려보내는 불일치가 있어(turnFeedback 선례 참고),
// camel/snake 양쪽 키를 모두 수용해 camelCase 정본으로 변환한다. 빈 문자열은 null로 취급.
function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : []
}

function normalizeDetailedFeedback(raw: unknown): DetailedFeedback | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  return {
    strength: asString(o.strength),
    weakness: asString(o.weakness),
    missingInfo: asStringArray(o.missingInfo ?? o.missing_info),
    improvementExample: asString(o.improvementExample ?? o.improvement_example),
    suggestedAnswer: asString(o.suggestedAnswer ?? o.suggested_answer),
    retryStrategy: asString(o.retryStrategy ?? o.retry_strategy),
  }
}

function normalizeFactCheck(raw: unknown): FactCheck | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const rawIncorrect = o.incorrectClaims ?? o.incorrect_claims
  const incorrectClaims: IncorrectClaim[] = Array.isArray(rawIncorrect)
    ? rawIncorrect
        .map((c) => {
          const ci = (c && typeof c === "object" ? c : {}) as Record<string, unknown>
          return {
            userClaim: asString(ci.userClaim ?? ci.user_claim),
            issue: asString(ci.issue),
            correctExplanation: asString(ci.correctExplanation ?? ci.correct_explanation),
            suggestedFix: asString(ci.suggestedFix ?? ci.suggested_fix),
          }
        })
        .filter((c) => c.userClaim || c.issue || c.correctExplanation || c.suggestedFix)
    : []
  return {
    isFactCheckApplicable: (o.isFactCheckApplicable ?? o.is_fact_check_applicable) === true,
    incorrectClaims,
    unsupportedClaims: asStringArray(o.unsupportedClaims ?? o.unsupported_claims),
  }
}

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

// 1:1 기술면접 이력을 CS 토픽별로 집계한 분석 결과. 이력 0건이어도 200 + 빈(topics:[]) 응답.
export async function getCsTopicAnalysis(): Promise<CsTopicAnalysisResponse> {
  return apiFetch<CsTopicAnalysisResponse>(
    "/interviews/cs-topics/analysis",
    { method: "GET" },
    "토픽 분석 조회에 실패했습니다"
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
  const data = result.data
  if (!data) return null

  // 문항별 신규 필드(detailedFeedback/factCheck)를 camel/snake 무관하게 정규화. 나머지 필드는 그대로.
  return {
    ...data,
    questionFeedback: Array.isArray(data.questionFeedback)
      ? data.questionFeedback.map((q: Record<string, unknown>) => ({
          ...q,
          detailedFeedback: normalizeDetailedFeedback(q.detailedFeedback ?? q.detailed_feedback),
          factCheck: normalizeFactCheck(q.factCheck ?? q.fact_check),
        }))
      : data.questionFeedback,
  }
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
