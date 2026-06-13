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

// 다음 답변 교정용 상세 피드백. 신규 필드 — 구버전/생성중 리포트엔 없을 수 있다.
// 백엔드 케이스 혼용(camel/snake) 대비해 API 레이어(getInterviewReport)에서 아래 정규화 형태로 변환된다.
export interface DetailedFeedback {
  strength: string | null
  weakness: string | null
  missingInfo: string[]
  // ↓ 60점 미만 문항에서만 채워짐. 60점 이상이면 null.
  improvementExample: string | null
  suggestedAnswer: string | null
  retryStrategy: string | null
}

export interface IncorrectClaim {
  userClaim: string | null          // 내가 한 말(틀린 주장)
  issue: string | null              // 무엇이 틀렸나
  correctExplanation: string | null // 올바른 개념
  suggestedFix: string | null       // 이렇게 고쳐 말하기
}

// 기술 사실 검증. isFactCheckApplicable=false(인성 문항 등)거나 내용 없으면 블록 숨김.
export interface FactCheck {
  isFactCheckApplicable: boolean
  incorrectClaims: IncorrectClaim[]
  unsupportedClaims: string[]
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
  // 신규: API 레이어에서 정규화된 상세 피드백/사실 검증. null/누락 가능.
  detailedFeedback?: DetailedFeedback | null
  factCheck?: FactCheck | null
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

// 자소서별 집계 리포트 (GET /reports/self-intro/{id}) — 면접 세션들의 집계
export type TrendDirection = "UP" | "STABLE" | "DOWN"
export type InterviewReadinessLevel = "READY" | "NEEDS_REVIEW" | "NEEDS_IMPROVEMENT"

export interface SessionScorePoint {
  sessionId: number
  round: number
  score: number
  date: string
}

export interface ItemTrendItem {
  item: string
  firstAvg: number
  lastAvg: number
  diff: number
  direction: TrendDirection
}

export interface SessionSummary {
  sessionId: number
  round: number
  score: number
  strengths: string
  weaknesses: WeaknessItem[]
  date: string
}

export interface RecommendedQuestionCount {
  text: string
  count: number
}

export interface ReadinessInfo {
  level: InterviewReadinessLevel
  comment: string
}

export interface SelfIntroReportResponse {
  selfIntroId: number
  companyName: string
  jobPosition: string
  totalSessions: number
  hasTrendData: boolean
  scoreTimeline: SessionScorePoint[]
  overallAverage: number | null
  itemAverages: Record<string, number> | null
  itemTrend: ItemTrendItem[]
  bestSession: SessionSummary | null
  worstSession: SessionSummary | null
  topRecommendedQuestions: RecommendedQuestionCount[]
  readiness: ReadinessInfo | null
  growthSummary: string
  // AI 종합 피드백 (cross-session). null이면 AI 실패/미배포 → growthSummary로 폴백.
  aiSummary: { overall: string; repeatedWeakness: string; nextSteps: string } | null
}

// CS 토픽 분석 (GET /interviews/cs-topics/analysis) — 1:1 기술면접 이력을 토픽별로 집계
export type CsTopic =
  | "DATA_STRUCTURE"
  | "ALGORITHM"
  | "NETWORK"
  | "OS"
  | "DATABASE"
  | "CONCURRENCY"
  | "MEMORY_GC"
  | "LANGUAGE"
  | "FRAMEWORK"
  | "DESIGN_PATTERN"
  | "SECURITY"

export interface CsTopicStat {
  topic: CsTopic
  questionCount: number
  averagePercentage: number
  recommendation: string
}

export interface CsTopicAnalysisResponse {
  topics: CsTopicStat[]
  weakTopics: CsTopicStat[]
}
