import { z } from "zod"

// 로그인
export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
})

// 회원가입 - Step 2: 기본 정보
export const signupStep2Schema = z.object({
  name: z.string().min(1, "실명을 입력해주세요"),
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 8~20자 영문/숫자/특수문자를 포함해야 합니다").max(20, "비밀번호는 최대 20자입니다"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})

// 회원가입 - Step 3: 직무 정보 (선택)
export const signupStep3Schema = z.object({
  experienceYears: z.number().int().optional(),
  preferredJobTypes: z.array(z.string()).optional(),
  preferredCompanies: z.array(z.string()).optional(),
})

// 이메일 찾기 - 휴대폰 인증
export const phoneVerificationSchema = z.object({
  phone: z.string().regex(/^010-?\d{3,4}-?\d{4}$/, "올바른 휴대폰 번호를 입력해주세요"),
  code: z.string().regex(/^\d{6}$/, "인증번호는 6자리 숫자입니다"),
})

// 비밀번호 찾기 - 새 비밀번호
export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "비밀번호는 8~20자 영문/숫자/특수문자를 포함해야 합니다").max(20, "비밀번호는 최대 20자입니다"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupStep2Input = z.infer<typeof signupStep2Schema>
export type SignupStep3Input = z.infer<typeof signupStep3Schema>
export type PhoneVerificationInput = z.infer<typeof phoneVerificationSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
