export interface HistoryListResponse {
  roomId: number
  companyName: string
  jobPosition: string
  interviewType: "TECHNICAL" | "PERSONALITY"
  interviewFormat: "ONE_ON_ONE" | "DEBATE"
  difficulty: "NORMAL" | "EASY" | "HARD"
  interviewCount: number
  createdAt: string
  completedAt: string
}

export interface HistoryDetailResponse {
  roomId: number
  companyName: string
  jobPosition: string
  interviewType: "TECHNICAL" | "PERSONALITY"
  interviewFormat: "ONE_ON_ONE" | "DEBATE"
  difficulty: "NORMAL" | "EASY" | "HARD"
  interviewCount: number
  pressureLevel: number
  followupCount: number
  interviewMode: string
  aiInterviewer: string
  createdAt: string
  completedAt: string
  sessions: HistorySession[]
}

export interface HistorySession {
  sessionId: number
  sessionNumber: number
  status: string
  startedAt: string
  endedAt: string
  questionAnswers: HistoryQuestionAnswer[]
}

export interface HistoryQuestionAnswer {
  questionId: number
  questionText: string
  questionOrder: number
  followUp: boolean
  answerText: string
  percentage: number | null
  starScore: number | null
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
