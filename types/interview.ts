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

export interface PersonaVideo {
  speakingVideoUrl?: string | null
  silenceVideoUrl?: string | null
}

export interface InterviewStartResponse {
  sessionId: number
  questions: SessionQuestion[]
  interviewer?: PersonaVideo | null
}

export interface SessionQuestion {
  questionId: number
  questionText: string
  questionOrder: number
  // 면접관 TTS(S3 mp3). null이면 음성 미지원/합성 실패/서버 TTS 비활성 → 텍스트만, 재생 UI 숨김.
  audioUrl?: string | null
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
  clipReason?: string
}

export interface AnswerProgressResponse {
  hasFollowUp: boolean
  followUpQuestionId?: number
  followUpQuestionText?: string
  lastQuestion: boolean
  // 꼬리질문 면접관 TTS(S3 mp3). null이면 텍스트만, 재생 UI 숨김.
  audioUrl?: string | null
  evaluation?: {
    structure?: number
    logic?: number
    specificity?: number
    jobFit?: number
  }
}
