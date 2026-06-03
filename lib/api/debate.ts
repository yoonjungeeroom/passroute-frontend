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
