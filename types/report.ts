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
  // 꼬리질문 여부. 백엔드가 questionFeedback를 실제 진행 순서로 내려주며, true면 직전 메인 질문의 하위(Q1-1)로 표기.
  // 구버전 리포트엔 없을 수 있어 optional.
  follow_up?: boolean
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
  voiceAnalysis: VoiceAnalysis | null
  faceAnalysis: FaceAnalysis | null
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
