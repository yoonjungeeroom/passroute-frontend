// 직무 타입 매핑
export const JOB_TYPES = {
  BACKEND_DEVELOPER: "백엔드 개발자",
  FRONTEND_DEVELOPER: "프론트엔드 개발자",
  WEB_DEVELOPER: "웹 개발자",
  APP_DEVELOPER: "앱 개발자",
  SYSTEM_ENGINEER: "시스템 엔지니어",
  NETWORK_ENGINEER: "네트워크 엔지니어",
  DBA: "DBA",
  DATA_ENGINEER: "데이터 엔지니어",
  DATA_SCIENTIST: "데이터 사이언티스트",
  SECURITY_ENGINEER: "보안 엔지니어",
  SOFTWARE_DEVELOPER: "소프트웨어 개발자",
  GAME_DEVELOPER: "게임 개발자",
  HARDWARE_DEVELOPER: "하드웨어 개발자",
  AI_ML_ENGINEER: "AI/ML 엔지니어",
  BLOCKCHAIN_DEVELOPER: "블록체인 개발자",
  CLOUD_ENGINEER: "클라우드 엔지니어",
  PROMPT_ENGINEER: "프롬프트 엔지니어",
  AI_SECURITY_SPECIALIST: "AI 보안 전문가",
  MLOPS_ENGINEER: "MLOps 엔지니어",
  AI_SERVICE_DEVELOPER: "AI 서비스 개발자",
} as const

export const EXPERIENCE_YEARS = {
  0: "신입 (0년)",
  2: "1~3년",
  5: "4~7년",
  10: "8년 이상",
} as const

export const authConfig = {
  loginPath: "/login",
  signupPath: "/signup",
  findEmailPath: "/find-email",
  findPasswordPath: "/find-password",
  dashboardPath: "/",
  phoneVerificationWindow: 30 * 60 * 1000, // 30 minutes
  codeExpiry: 3 * 60 * 1000, // 3 minutes
}

// 비밀번호 강도 검증
export function validatePassword(password: string) {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push("최소 8자 이상 필요")
  } else if (password.length > 20) {
    errors.push("최대 20자 이내")
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("영문자 포함 필요")
  }
  if (!/\d/.test(password)) {
    errors.push("숫자 포함 필요")
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("특수문자 포함 필요")
  }
  
  return {
    valid: errors.length === 0 && password.length >= 8 && password.length <= 20,
    errors,
  }
}

// 휴대폰 번호 포맷팅 (010-0000-0000)
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length !== 10) return phone
  
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
}

// 휴대폰 번호 파싱 (하이픈 제거)
export function parsePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "")
}

// API Response 타입 (백엔드 ApiResponse 구조와 일치)
export interface ApiResponse<T> {
  status: "success" | "error"
  httpStatus: number
  code: string
  message: string
  data: T | null
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface FindEmailResponse {
  maskedEmail: string
}
