import { apiFetch } from "./client"

export interface DebateTopic {
  id: number
  topicKey: string
  title: string
  description: string
  category: string
  proKeyPoints: string[]
  conKeyPoints: string[]
}

export interface DebatePersona {
  id: number
  personaKey: string
  name: string
  background: string
  debateStyle: string
  difficulty: string
  strengths: string[]
  weaknesses: string[]
}

export interface DebateSessionCreateResponse {
  sessionId: number
}

export type SpeakerType = "USER" | "AI_COMPETITOR" | "AI_INTERVIEWER"
export type DebateRound = "OPENING" | "REBUTTAL_1" | "REBUTTAL_2" | "CLOSING" | "MODERATION"

export interface DebateTurn {
  id: number
  speakerType: SpeakerType
  round: DebateRound
  stance: string
  content: string
  audioUrl: string | null
  createdAt: string
}

export interface DebateStateResponse {
  sessionId: number
  currentState: string
  waitingForUser: boolean
  version: number
  latestTurns: DebateTurn[]
}

export interface SuggestedTopicCandidate {
  title: string
  description: string
  category: string
}

export interface SuggestTopicsResponse {
  candidates: SuggestedTopicCandidate[]
  newsCount: number
}

/**
 * 최신 뉴스 기반 토론 주제 후보 추천 (AI 서버 + 크롤링).
 * 수 초 걸릴 수 있어 공통 클라이언트와 별개로 자체 타임아웃을 둔다.
 */
export async function suggestDebateTopics(data: {
  keywords?: string[]
  count?: number
}): Promise<SuggestTopicsResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 120_000)
  try {
    return await apiFetch<SuggestTopicsResponse>(
      "/debate/topics/suggest",
      { method: "POST", body: JSON.stringify(data), signal: controller.signal },
      "토론 주제 추천에 실패했습니다"
    )
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 선택한 후보로 실제 토론 주제 생성 + 저장 → topicId(=id) 발급 (HTTP 201).
 * 뉴스 크롤링/생성이라 수십 초 걸릴 수 있음. 백엔드 타임아웃 180초보다 살짝 길게 잡아
 * 백엔드 응답(성공/에러 envelope)이 먼저 도착하게 한다.
 */
export async function generateDebateTopic(data: {
  title: string
  description?: string
  category: string
}): Promise<DebateTopic> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 190_000)
  try {
    return await apiFetch<DebateTopic>(
      "/debate/topics/generate",
      { method: "POST", body: JSON.stringify(data), signal: controller.signal },
      "토론 주제 생성에 실패했습니다"
    )
  } finally {
    clearTimeout(timer)
  }
}

export async function getDebateTopics(category?: string): Promise<DebateTopic[]> {
  const query = category ? `?category=${category}` : ""
  return apiFetch<DebateTopic[]>(
    `/debate/topics${query}`,
    { method: "GET" },
    "토론 주제 조회에 실패했습니다"
  )
}

export async function getDebatePersonas(): Promise<DebatePersona[]> {
  return apiFetch<DebatePersona[]>(
    "/debate/personas",
    { method: "GET" },
    "토론 페르소나 조회에 실패했습니다"
  )
}

export async function createDebateSession(data: {
  topicId: number
  userStance: "PRO" | "CON"
  personaId: number
  difficulty: "EASY" | "NORMAL" | "HARD"
}): Promise<DebateSessionCreateResponse> {
  return apiFetch<DebateSessionCreateResponse>(
    "/debate/sessions",
    { method: "POST", body: JSON.stringify(data) },
    "토론 세션 생성에 실패했습니다"
  )
}

export async function startDebateSession(sessionId: number): Promise<void> {
  return apiFetch<void>(
    `/debate/${sessionId}/start`,
    { method: "POST" },
    "토론 시작에 실패했습니다"
  )
}

export async function getDebateState(sessionId: number): Promise<DebateStateResponse> {
  return apiFetch<DebateStateResponse>(
    `/debate/${sessionId}/state`,
    { method: "GET" },
    "토론 상태 조회에 실패했습니다"
  )
}

export async function submitDebateTurn(sessionId: number): Promise<void> {
  return apiFetch<void>(
    `/debate/${sessionId}/turn`,
    { method: "POST" },
    "토론 턴 제출에 실패했습니다"
  )
}

export async function endDebateSession(sessionId: number): Promise<void> {
  return apiFetch<void>(
    `/debate/${sessionId}/end`,
    { method: "POST" },
    "토론 종료에 실패했습니다"
  )
}
