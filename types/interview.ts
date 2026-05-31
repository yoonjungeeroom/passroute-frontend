export type InterviewType = "TECHNICAL" | "PERSONALITY"
export type InterviewFormat = "ONE_ON_ONE" | "DEBATE"
export type PracticeMode = "PRACTICE" | "REAL"

export interface InterviewSetupRequest {
  siId?: number
  resumeId?: number
  portfolioId?: number
  companyName: string
  jobPosition: string
  interviewType: InterviewType
  interviewMode: string
  interviewFormat: InterviewFormat
  aiInterviewer: string
  aiCompetitors?: string
  debateTopic?: string
  interviewCount?: number
  difficulty: "EASY" | "NORMAL" | "HARD"
  pressureLevel?: number
  followupCount?: number
}

export interface InterviewRoomResponse {
  roomId: number
}

export interface InterviewStartResponse {
  sessionId: number
  questions: SessionQuestion[]
}

export interface SessionQuestion {
  questionId: number
  questionText: string
  questionOrder: number
}

export interface AnswerSubmission {
  questionId: number
  answerText: string
  voiceData?: {
    filler_word_count: number
    wpm: number
  }
  videoUrl?: string
  clipScore?: number
}

export interface AnswerProgressResponse {
  hasFollowUp: boolean
  followUpQuestionId?: number
  followUpQuestionText?: string
  lastQuestion: boolean
  evaluation?: {
    structure?: number
    logic?: number
    specificity?: number
    jobFit?: number
  }
}
