"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Loader2, ChevronLeft, Check } from "lucide-react"
import { phoneVerificationSchema, resetPasswordSchema, type PhoneVerificationInput, type ResetPasswordInput } from "@/lib/auth-schemas"
import { formatPhoneNumber, parsePhoneNumber, validatePassword } from "@/lib/auth-config"
import { AuthBrandingPanel } from "@/components/auth-branding-panel"

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

  const verifyForm = useForm<PhoneVerificationInput>({
    resolver: zodResolver(phoneVerificationSchema),
  })

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
      const response = await fetch(`/auth/find-password/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsePhoneNumber(verifyPhoneValue) }),
      })

      const result = await response.json()

      if (!response.ok) {
        setInlineError(result.message || "인증 발송에 실패했습니다")
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
      const response = await fetch(`/auth/find-password/reset`, {
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
        setInlineError(result.message || "비밀번호 변경에 실패했습니다")
        return
      }

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
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row md:h-160">
        <AuthBrandingPanel
          subtitle={"비밀번호를\n재설정하세요"}
          description="휴대폰 인증 후 새로운 비밀번호를 설정할 수 있습니다."
        />

        {/* Right Panel — Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center overflow-y-auto scrollbar-hide">
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">passroute</h1>
          </div>

          {inlineError && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-3 mb-4">
              <p className="text-sm text-rose-500">{inlineError}</p>
            </div>
          )}

          {step === "verify" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">비밀번호 재설정</h1>
              <p className="text-sm text-muted-foreground mb-8">휴대폰 번호를 인증하여 비밀번호를 변경하세요</p>

              <form className="space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground mb-1">휴대폰 번호</label>
                  <div className="flex gap-2">
                    <Input
                      {...verifyForm.register("phone")}
                      type="tel"
                      placeholder="010-0000-0000"
                      className="h-11 border-border bg-background flex-1"
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
                      className="h-11 border-border"
                    >
                      {codeSent ? `재발송 (${formatCountdown(countdown)})` : "인증번호 발송"}
                    </Button>
                  </div>
                  {verifyForm.formState.errors.phone && (
                    <p className="text-xs text-rose-500">{verifyForm.formState.errors.phone.message}</p>
                  )}
                </div>

                {codeSent && (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground mb-1">인증번호</label>
                      <Input
                        {...verifyForm.register("code")}
                        type="text"
                        placeholder="인증번호 6자리"
                        maxLength={6}
                        className="h-11 border-border bg-background"
                        disabled={isLoading}
                      />
                      {verifyForm.formState.errors.code && (
                        <p className="text-xs text-rose-500">{verifyForm.formState.errors.code.message}</p>
                      )}
                      {countdown < 30 && (
                        <p className="text-xs text-rose-500">
                          인증번호가 {formatCountdown(countdown)} 후 만료됩니다
                        </p>
                      )}
                    </div>

                    <Button type="button" onClick={handleVerifyCode} disabled={isLoading} className="w-full h-11 text-sm font-semibold">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          확인 중...
                        </>
                      ) : (
                        "인증 확인"
                      )}
                    </Button>
                  </>
                )}
              </form>

              <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6">
                <ChevronLeft className="h-4 w-4" />
                로그인으로 돌아가기
              </Link>
            </>
          )}

          {step === "reset" && (
            <>
              <button
                onClick={() => setStep("verify")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ChevronLeft className="h-4 w-4" />
                이전 단계
              </button>
              <h1 className="text-2xl font-bold text-foreground mb-1">새 비밀번호 입력</h1>
              <p className="text-sm text-muted-foreground mb-8">새로운 비밀번호를 설정해 주세요</p>

              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground mb-1">새 비밀번호</label>
                  <div className="relative">
                    <Input
                      {...resetForm.register("newPassword")}
                      type={showPassword ? "text" : "password"}
                      placeholder="8~20자 영문/숫자/특수문자"
                      className="h-11 border-border bg-background pr-10"
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
                        <p key={error} className="text-xs text-rose-500">• {error}</p>
                      ))}
                      {passwordStrength.valid && (
                        <p className="text-xs text-emerald-500 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          강력한 비밀번호입니다
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground mb-1">새 비밀번호 확인</label>
                  <div className="relative">
                    <Input
                      {...resetForm.register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호를 한 번 더 입력하세요"
                      className="h-11 border-border bg-background pr-10"
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
                    <p className="text-xs text-rose-500">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !passwordStrength.valid || !passwordsMatch}
                  className="w-full h-11 text-sm font-semibold disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      변경 중...
                    </>
                  ) : (
                    "비밀번호 변경"
                  )}
                </Button>
              </form>

              <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6">
                <ChevronLeft className="h-4 w-4" />
                로그인으로 돌아가기
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
