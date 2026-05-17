"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, ChevronLeft, Check } from "lucide-react"
import { phoneVerificationSchema, resetPasswordSchema, type PhoneVerificationInput, type ResetPasswordInput } from "@/lib/auth-schemas"
import { formatPhoneNumber, parsePhoneNumber, validatePassword } from "@/lib/auth-config"

type Step = "verify" | "reset"

export default function FindPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("verify")
  const [isLoading, setIsLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [inlineError, setInlineError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ valid: false, errors: [] as string[] })
  const [verifiedPhone, setVerifiedPhone] = useState("")
  const [verifiedCode, setVerifiedCode] = useState("")

  // Step 1: Verification
  const verifyForm = useForm<PhoneVerificationInput>({
    resolver: zodResolver(phoneVerificationSchema),
  })

  // Step 2: Reset Password
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const verifyPhoneValue = verifyForm.watch("phone")
  const passwordValue = resetForm.watch("newPassword")
  const confirmPasswordValue = resetForm.watch("confirmPassword")
  const passwordsMatch = passwordValue && confirmPasswordValue && passwordValue === confirmPasswordValue

  if (passwordValue) {
    const strength = validatePassword(passwordValue)
    if (JSON.stringify(strength) !== JSON.stringify(passwordStrength)) {
      setPasswordStrength(strength)
    }
  }

  const handleSendCode = async () => {
    if (!verifyPhoneValue) {
      verifyForm.setError("phone", { message: "휴대폰 번호를 입력해주세요" })
      return
    }

    setIsLoading(true)
    setInlineError("")
    try {
      const response = await fetch("http://localhost:8080/auth/find-password/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsePhoneNumber(verifyPhoneValue) }),
      })

      const result = await response.json()

      if (!response.ok) {
        setInlineError(result.error?.message || "인증 발송에 실패했습니다")
        return
      }

      setCodeSent(true)
      setCountdown(180)

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

  const handleVerifyCode = async () => {
    const isValid = await verifyForm.trigger()
    if (!isValid) return

    const { phone, code } = verifyForm.getValues()
    setIsLoading(true)
    setInlineError("")

    try {
      // Just verify without reset - backend will confirm it's valid
      setVerifiedPhone(parsePhoneNumber(phone))
      setVerifiedCode(code)
      setStep("reset")
    } catch (error) {
      setInlineError("네트워크 오류가 발생했습니다")
      console.error("[v0] Verify error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const onResetSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    setInlineError("")

    try {
      const response = await fetch("http://localhost:8080/auth/find-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: verifiedPhone,
          code: verifiedCode,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setInlineError(result.error?.message || "비밀번호 변경에 실패했습니다")
        return
      }

      // Success toast and redirect
      router.push("/login?reset=success")
    } catch (error) {
      setInlineError("네트워크 오류가 발생했습니다")
      console.error("[v0] Reset error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

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

        {/* Form Card */}
        <Card className="border-border/50 bg-card shadow-xl">
          <CardContent className="pt-8">
            {inlineError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 mb-4">
                <p className="text-sm text-rose-400">{inlineError}</p>
              </div>
            )}

            {step === "verify" && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">비밀번호 재설정</h1>
                  <p className="text-sm text-muted-foreground">휴대폰 번호를 인증하여 비밀번호를 변경하세요</p>
                </div>

                <form className="space-y-4">
                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">휴대폰 번호</label>
                    <div className="flex gap-2">
                      <Input
                        {...verifyForm.register("phone")}
                        type="tel"
                        placeholder="010-0000-0000"
                        className="border-border/50 bg-secondary/30 flex-1"
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value)
                          verifyForm.setValue("phone", formatted)
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
                    {verifyForm.formState.errors.phone && (
                      <p className="text-xs text-rose-400">{verifyForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  {/* Code Input */}
                  {codeSent && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">인증번호</label>
                        <Input
                          {...verifyForm.register("code")}
                          type="text"
                          placeholder="인증번호 6자리"
                          maxLength={6}
                          className="border-border/50 bg-secondary/30"
                          disabled={isLoading}
                        />
                        {verifyForm.formState.errors.code && (
                          <p className="text-xs text-rose-400">{verifyForm.formState.errors.code.message}</p>
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

                {/* Back to Login */}
                <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                  로그인으로 돌아가기
                </Link>
              </div>
            )}

            {step === "reset" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setStep("verify")}
                    className="p-1 hover:bg-secondary/30 rounded transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <h1 className="text-2xl font-bold text-foreground">새 비밀번호를 입력해 주세요</h1>
                </div>

                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">새 비밀번호</label>
                    <div className="relative">
                      <Input
                        {...resetForm.register("newPassword")}
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
                    <label className="text-sm font-medium text-foreground">새 비밀번호 확인</label>
                    <div className="relative">
                      <Input
                        {...resetForm.register("confirmPassword")}
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
                    </div>
                    {resetForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-rose-400">{resetForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !passwordStrength.valid || !passwordsMatch}
                    className="w-full gap-2 bg-gradient-to-r from-primary to-violet-600 py-6 text-base font-semibold text-white shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        변경 중...
                      </>
                    ) : (
                      <>비밀번호 변경</>
                    )}
                  </Button>
                </form>

                {/* Back to Login */}
                <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                  로그인으로 돌아가기
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
