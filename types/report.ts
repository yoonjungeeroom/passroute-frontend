export type InterviewType = "TECHNICAL" | "PERSONALITY"

export interface VoiceAnalysis {
  avgWpm: number
  avgSilenceDuration: number
  fillerCount: number
  voiceScore: number
}

export interface FaceAnalysis {
  avgGazeRatio: number
  gazeOffCount: number
  avgBlinkPerMin: number
  faceScore: number
}

export interface WeaknessItem {
  item: string
  comment: string
}

export interface QuestionFeedback {
  question_index: number
  question: string
  question_type: string
  percentage: number
  feedback: string
  star_comment: string | null
  voice_comment: string | null
}

export interface InterviewReportResponse {
  sessionId: number
  sessionScore: number
  voiceAnalysis: VoiceAnalysis | null
  faceAnalysis: FaceAnalysis | null
  interviewReadiness: string
  itemAverages: Record<string, number>
  keyWeakness: string[]
  overall: string
  strengths: string
  weaknesses: WeaknessItem[]
  improvements: string
  questionFeedback: QuestionFeedback[]
  recommendedQuestions: string[]
  finalAdvice: string
  readinessComment: string
  createdAt: string
}

export interface TurnFeedback {
  roundType: string
  weightedScore: number
  feedback: string
}

export interface DebateReportResponse {
  sessionId: number
  sessionScore: number
  overall: string
  strengths: string
  weaknesses: WeaknessItem[]
  improvements: string
  turnFeedback: TurnFeedback[]
  strategyAnalysis: string
  recommendedTopics: string[]
  finalAdvice: string
  debateReadinessComment: string
  createdAt: string
}
