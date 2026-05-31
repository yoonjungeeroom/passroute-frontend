import { apiFetch, getAuthHeaders } from "./client"
import type {
  InterviewSetupRequest,
  InterviewRoomResponse,
  InterviewStartResponse,
  AnswerSubmission,
  AnswerProgressResponse,
  SessionQuestion,
} from "@/types/interview"

export async function setupInterview(data: InterviewSetupRequest): Promise<InterviewRoomResponse> {
  return apiFetch<InterviewRoomResponse>("/interview/setup", {
    method: "POST",
    body: JSON.stringify(data),
  }, "면접 설정에 실패했습니다")
}

export async function startInterview(roomId: number): Promise<InterviewStartResponse> {
  return apiFetch<InterviewStartResponse>("/interview/start", {
    method: "POST",
    body: JSON.stringify({ roomId }),
  }, "면접 시작에 실패했습니다")
}

export async function getSessionQuestions(sessionId: number): Promise<SessionQuestion[]> {
  const result = await apiFetch<{ questions: SessionQuestion[] }>(
    `/interview/sessions/${sessionId}/questions`,
    { method: "GET" },
    "질문 목록 조회에 실패했습니다"
  )
  return result.questions
}

export async function submitAnswer(
  sessionId: number,
  data: AnswerSubmission
): Promise<AnswerProgressResponse> {
  return apiFetch<AnswerProgressResponse>(
    `/interview/sessions/${sessionId}/answers`,
    { method: "POST", body: JSON.stringify(data) },
    "답변 제출에 실패했습니다"
  )
}

export async function endInterview(sessionId: number): Promise<void> {
  const response = await fetch(`/interview/sessions/${sessionId}/end`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  // 202 Accepted - 리포트 비동기 생성
  if (!response.ok && response.status !== 202) {
    throw new Error("면접 종료에 실패했습니다")
  }
}

export async function getWorstClip(sessionId: number): Promise<string> {
  return apiFetch<string>(
    `/interview/sessions/${sessionId}/worst-clip`,
    { method: "GET" },
    "클립 조회에 실패했습니다"
  )
}
