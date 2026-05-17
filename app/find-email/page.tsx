"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ChevronLeft, Mail } from "lucide-react"
import { phoneVerificationSchema, type PhoneVerificationInput } from "@/lib/auth-schemas"
import { formatPhoneNumber, parsePhoneNumber, type FindEmailResponse } from "@/lib/auth-config"

type Step = "verify" | "result"

export default function FindEmailPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("verify")
  const [isLoading, setIsLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [inlineError, setInlineError] = useState("")
  const [maskedEmail, setMaskedEmail] = useState("")

  const { register, handleSubmit, watch, setValue, setError, trigger, formState: { errors } } = useForm<PhoneVerificationInput>({
    resolver: zodResolver(phoneVerificationSchema),
  })

  const phoneValue = watch("phone")

  const handleSendCode = async () => {
    if (!phoneValue) {
      setError("phone", { message: "휴대폰 번호를 입력해주세요" })
      return
    }

    setIsLoading(true)
    setInlineError("")
    try {
      const response = await fetch("http://localhost:8080/auth/find-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsePhoneNumber(phoneValue) }),
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

  const onSubmit = async (data: PhoneVerificationInput) => {
    setIsLoading(true)
    setInlineError("")

    try {
      const response = await fetch("http://localhost:8080/auth/find-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsePhoneNumber(data.phone), code: data.code }),
      })

      const result = await response.json() as { data?: FindEmailResponse; error?: { message: string } }

      if (!response.ok) {
        setInlineError("인증번호가 올바르지 않습니다")
        return
      }

      setMaskedEmail(result.data?.maskedEmail || "")
      setStep("result")
    } catch (error) {
      setInlineError("네트워크 오류가 발생했습니다")
      console.error("[v0] Verify error:", error)
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
                  <h1 className="text-2xl font-bold text-foreground mb-1">이메일 찾기</h1>
                  <p className="text-sm text-muted-foreground">휴대폰 번호를 인증하여 가입된 이메일을 확인하세요</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">휴대폰 번호</label>
                    <div className="flex gap-2">
                      <Input
                        {...register("phone")}
                        type="tel"
                        placeholder="010-0000-0000"
                        className="border-border/50 bg-secondary/30 flex-1"
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value)
                          setValue("phone", formatted)
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
                    {errors.phone && (
                      <p className="text-xs text-rose-400">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Code Input */}
                  {codeSent && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">인증번호</label>
                      <Input
                        {...register("code")}
                        type="text"
                        placeholder="인증번호 6자리"
                        maxLength={6}
                        className="border-border/50 bg-secondary/30"
                        disabled={isLoading}
                      />
                      {errors.code && (
                        <p className="text-xs text-rose-400">{errors.code.message}</p>
                      )}
                      {countdown < 30 && (
                        <p className="text-xs text-rose-400">
                          인증번호가 {formatCountdown(countdown)} 후 만료됩니다
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  {codeSent && (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full gap-2 bg-gradient-to-r from-primary to-violet-600 py-6 text-base font-semibold text-white shadow-lg shadow-primary/30 hover:opacity-90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          확인 중...
                        </>
                      ) : (
                        <>이메일 확인</>
                      )}
                    </Button>
                  )}
                </form>

                {/* Back to Login */}
                <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                  로그인으로 돌아가기
                </Link>
              </div>
            )}

            {step === "result" && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">이메일 확인됨</h2>
                  <p className="text-sm text-muted-foreground">
                    가입된 이메일은
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
                  <p className="text-lg font-semibold text-foreground">{maskedEmail}</p>
                  <p className="text-xs text-muted-foreground mt-1">입니다</p>
                </div>

                <Button
                  onClick={() => router.push("/login")}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-violet-600 py-6 text-base font-semibold text-white shadow-lg shadow-primary/30 hover:opacity-90"
                >
                  로그인하러 가기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
