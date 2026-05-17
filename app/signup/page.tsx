"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, Check, X, Loader2, ChevronLeft, Plus, Trash2 } from "lucide-react"
import { phoneVerificationSchema, signupStep2Schema, signupStep3Schema, type PhoneVerificationInput, type SignupStep2Input, type SignupStep3Input } from "@/lib/auth-schemas"
import { formatPhoneNumber, parsePhoneNumber, validatePassword, JOB_TYPES, EXPERIENCE_YEARS } from "@/lib/auth-config"

type SignupStep = 1 | 2 | 3

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<SignupStep>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [inlineError, setInlineError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState({ valid: false, errors: [] as string[] })
  
  // Form state preservation
  const [formData, setFormData] = useState({
    phone: "",
    code: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    experienceYears: 0,
    preferredJobTypes: [] as string[],
    preferredCompanies: [] as string[],
  })

  // Step 1: Phone Verification
  const step1Form = useForm<PhoneVerificationInput>({
    resolver: zodResolver(phoneVerificationSchema),
    defaultValues: { phone: formData.phone, code: formData.code },
  })

  // Step 2: Basic Info
  const step2Form = useForm<SignupStep2Input>({
    resolver: zodResolver(signupStep2Schema),
    defaultValues: { name: formData.name, email: formData.email, password: formData.password, confirmPassword: formData.confirmPassword },
  })

  // Step 3: Job Info
  const step3Form = useForm<SignupStep3Input>({
    resolver: zodResolver(signupStep3Schema),
    defaultValues: { experienceYears: formData.experienceYears, preferredJobTypes: formData.preferredJobTypes, preferredCompanies: formData.preferredCompanies },
  })

  // Step 1: Send verification code
  const handleSendCode = async () => {
    const phoneValue = step1Form.watch("phone")
    if (!phoneValue) {
      step1Form.setError("phone", { message: "휴대폰 번호를 입력해주세요" })
      return
    }

    setIsLoading(true)
    setInlineError("")
    try {
      const response = await fetch("http://localhost:8080/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsePhoneNumber(phoneValue) }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 400 && result.error.code === "ALREADY_REGISTERED") {
          setInlineError("이미 가입된 휴대폰 번호입니다")
        } else {
          setInlineError(result.error?.message || "인증 발송에 실패했습니다")
        }
        return
      }

      setCodeSent(true)
      setCountdown(180) // 3 minutes
      
      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setCodeSent(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      setInlineError("네트워크 오류가 발생했습니다")
      console.error("[v0] Send code error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1: Verify code
  const handleVerifyCode = async () => {
    const isValid = await step1Form.trigger()
    if (!isValid) return

    const { phone, code } = step1Form.getValues()
    setIsLoading(true)
    setInlineError("")
    
    try {
      const response = await fetch("http://localhost:8080/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsePhoneNumber(phone), code }),
      })

      const result = await response.json()

      if (!response.ok) {
        setInlineError("인증번호가 올바르지 않습니다")
        return
      }

      // Save phone and move to step 2
      setFormData(prev => ({ ...prev, phone: parsePhoneNumber(phone) }))
      setStep(2)
    } catch (error) {
      setInlineError("네트워크 오류가 발생했습니다")
      console.error("[v0] Verify code error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Submit basic info
  const handleStep2Submit = async () => {
    const isValid = await step2Form.trigger()
    if (!isValid) return

    const { name, email, password, confirmPassword } = step2Form.getValues()
    setFormData(prev => ({ ...prev, name, email, password, confirmPassword }))
    setStep(3)
  }

  // Step 3: Complete signup
  const handleCompleteSignup = async (skipJobInfo: boolean = false) => {
    if (!skipJobInfo) {
      const isValid = await step3Form.trigger()
      if (!isValid) return
    }

    const { experienceYears, preferredJobTypes, preferredCompanies } = step3Form.getValues()
    
    setIsLoading(true)
    setInlineError("")

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        experienceYears: experienceYears || undefined,
        preferredJobTypes: preferredJobTypes?.length ? preferredJobTypes : undefined,
        preferredCompanies: preferredCompanies?.length ? preferredCompanies : undefined,
      }

      const response = await fetch("http://localhost:8080/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setInlineError("이미 사용 중인 이메일입니다")
          setStep(2)
        } else if (response.status === 400 && result.error.code === "PHONE_NOT_VERIFIED") {
          setInlineError("휴대폰 인증을 다시 진행해 주세요")
          setStep(1)
        } else {
          setInlineError(result.error?.message || "회원가입에 실패했습니다")
        }
        return
      }

      // Success toast and redirect to login
      router.push("/login?signup=success")
    } catch (error) {
      setInlineError("네트워크 오류가 발생했습니다")
      console.error("[v0] Signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const passwordValue = step2Form.watch("password")
  if (passwordValue) {
    const strength = validatePassword(passwordValue)
    if (JSON.stringify(strength) !== JSON.stringify(passwordStrength)) {
      setPasswordStrength(strength)
    }
  }

  const passwordConfirmValue = step2Form.watch("confirmPassword")
  const passwordsMatch = passwordValue && passwordConfirmValue && passwordValue === passwordConfirmValue

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/30">
              <span className="text-lg font-bold text-white">P</span>
            </div>
            <span className="text-2xl font-bold text-foreground">패스루트</span>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-border/30"}`} />
          ))}
        </div>

        {/* Form Card */}
        <Card className="border-border/50 bg-card shadow-xl">
          <CardContent className="pt-8">
            {/* Inline Error */}
            {inlineError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 mb-4">
                <p className="text-sm text-rose-400">{inlineError}</p>
              </div>
            )}

            {/* STEP 1: Phone Verification */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">휴대폰 번호 인증</h1>
                  <p className="text-sm text-muted-foreground">본인 확인을 위해 휴대폰 번호를 인증해 주세요</p>
                </div>

                <form className="space-y-4">
                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">휴대폰 번호</label>
                    <div className="flex gap-2">
                      <Input
                        {...step1Form.register("phone")}
                        type="tel"
                        placeholder="010-0000-0000"
                        className="border-border/50 bg-secondary/30 flex-1"
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value)
                          step1Form.setValue("phone", formatted)
                        }}
                        disabled={codeSent || isLoading}
                      />
                      <Button
                        type="button"
                        onClick={handleSendCode}
                        disabled={codeSent || isLoading}
                        variant={codeSent ? "ghost" : "outline"}
                        className="border-border/50"
                      >
                        {codeSent ? `재발송 (${formatCountdown(countdown)})` : "인증번호 발송"}
                      </Button>
                    </div>
                    {step1Form.formState.errors.phone && (
                      <p className="text-xs text-rose-400">{step1Form.formState.errors.phone.message}</p>
                    )}
                  </div>

                  {/* Code Input */}
                  {codeSent && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">인증번호</label>
                        <Input
                          {...step1Form.register("code")}
                          type="text"
                          placeholder="인증번호 6자리"
                          maxLength={6}
                          className="border-border/50 bg-secondary/30"
                          disabled={isLoading}
                        />
                        {step1Form.formState.errors.code && (
                          <p className="text-xs text-rose-400">{step1Form.formState.errors.code.message}</p>
                        )}
                        {countdown < 30 && (
                          <p className="text-xs text-rose-400">
                            인증번호가 {formatCountdown(countdown)} 후 만료됩니다
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={isLoading}
                        className="w-full gap-2 bg-gradient-to-r from-primary to-violet-600 py-6 text-base font-semibold text-white shadow-lg shadow-primary/30 hover:opacity-90"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            확인 중...
                          </>
                        ) : (
                          <>인증 확인</>
                        )}
                      </Button>
                    </>
                  )}
                </form>
              </div>
            )}

            {/* STEP 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setStep(1)}
                    className="p-1 hover:bg-secondary/30 rounded transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <h1 className="text-2xl font-bold text-foreground">기본 정보를 입력해 주세요</h1>
                </div>

                <form className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">이름</label>
                    <Input
                      {...step2Form.register("name")}
                      placeholder="실명을 입력하세요"
                      className="border-border/50 bg-secondary/30"
                      disabled={isLoading}
                    />
                    {step2Form.formState.errors.name && (
                      <p className="text-xs text-rose-400">{step2Form.formState.errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">이메일</label>
                    <Input
                      {...step2Form.register("email")}
                      type="email"
                      placeholder="이메일을 입력하세요"
                      className="border-border/50 bg-secondary/30"
                      disabled={isLoading}
                    />
                    {step2Form.formState.errors.email && (
                      <p className="text-xs text-rose-400">{step2Form.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">비밀번호</label>
                    <div className="relative">
                      <Input
                        {...step2Form.register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="8~20자 영문/숫자/특수문자"
                        className="border-border/50 bg-secondary/30 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordValue && (
                      <div className="space-y-1">
                        {passwordStrength.errors.map((error) => (
                          <p key={error} className="text-xs text-rose-400">• {error}</p>
                        ))}
                        {passwordStrength.valid && (
                          <p className="text-xs text-emerald-400 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            강력한 비밀번호입니다
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">비밀번호 확인</label>
                    <div className="relative">
                      <Input
                        {...step2Form.register("confirmPassword")}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="비밀번호를 한 번 더 입력하세요"
                        className="border-border/50 bg-secondary/30 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {passwordConfirmValue && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                          {passwordsMatch ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <X className="h-4 w-4 text-rose-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {step2Form.formState.errors.confirmPassword && (
                      <p className="text-xs text-rose-400">{step2Form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Next Button */}
                  <Button
                    type="button"
                    onClick={handleStep2Submit}
                    disabled={isLoading || !passwordStrength.valid || !passwordsMatch}
                    className="w-full gap-2 bg-gradient-to-r from-primary to-violet-600 py-6 text-base font-semibold text-white shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-50"
                  >
                    다음
                  </Button>
                </form>
              </div>
            )}

            {/* STEP 3: Job Info (Optional) */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setStep(2)}
                    className="p-1 hover:bg-secondary/30 rounded transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">직무 정보를 알려주세요</h1>
                    <p className="text-sm text-muted-foreground">(선택) 맞춤형 채용 정보를 추천해 드려요</p>
                  </div>
                </div>

                <form className="space-y-6">
                  {/* Experience Years */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">경력</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(EXPERIENCE_YEARS).map(([years, label]) => (
                        <button
                          key={years}
                          type="button"
                          onClick={() => step3Form.setValue("experienceYears", parseInt(years))}
                          className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                            step3Form.watch("experienceYears") === parseInt(years)
                              ? "bg-primary/20 border-primary text-primary"
                              : "border-border/50 text-muted-foreground hover:border-border"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Job Types */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">희망 직무</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(JOB_TYPES).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const current = step3Form.watch("preferredJobTypes") || []
                            const updated = current.includes(key)
                              ? current.filter(t => t !== key)
                              : [...current, key]
                            step3Form.setValue("preferredJobTypes", updated)
                          }}
                          className={`p-2 rounded-lg border transition-all text-xs font-medium text-center ${
                            (step3Form.watch("preferredJobTypes") || []).includes(key)
                              ? "bg-primary/20 border-primary text-primary"
                              : "border-border/50 text-muted-foreground hover:border-border"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Companies */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">희망 기업</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 min-h-10 p-2 rounded-lg border border-border/50 bg-secondary/30">
                        {(step3Form.watch("preferredCompanies") || []).map((company, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded text-sm">
                            {company}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (step3Form.watch("preferredCompanies") || []).filter((_, i) => i !== idx)
                                step3Form.setValue("preferredCompanies", updated)
                              }}
                              className="hover:text-primary/80"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          id="company-input"
                          type="text"
                          placeholder="기업명 입력 후 Enter"
                          className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-secondary/30 text-foreground placeholder-muted-foreground text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const value = (e.target as HTMLInputElement).value.trim()
                              if (value) {
                                const current = step3Form.watch("preferredCompanies") || []
                                step3Form.setValue("preferredCompanies", [...current, value])
                                ;(e.target as HTMLInputElement).value = ""
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => {
                            const input = document.getElementById("company-input") as HTMLInputElement
                            const value = input?.value.trim()
                            if (value) {
                              const current = step3Form.watch("preferredCompanies") || []
                              step3Form.setValue("preferredCompanies", [...current, value])
                              input.value = ""
                            }
                          }}
                          variant="outline"
                          className="border-border/50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={() => handleCompleteSignup(true)}
                      disabled={isLoading}
                      variant="ghost"
                      className="flex-1"
                    >
                      건너뛰기
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleCompleteSignup(false)}
                      disabled={isLoading}
                      className="flex-1 gap-2 bg-gradient-to-r from-primary to-violet-600 py-6 text-base font-semibold text-white shadow-lg shadow-primary/30 hover:opacity-90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          가입 중...
                        </>
                      ) : (
                        <>가입 완료</>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Login Link */}
            {step === 1 && (
              <p className="text-center text-sm text-muted-foreground mt-6">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-primary hover:text-violet-400 transition-colors font-medium">
                  로그인
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
