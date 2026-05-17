"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { loginSchema, type LoginInput } from "@/lib/auth-schemas"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [inlineError, setInlineError] = useState("")
  const [isLoadingSocial, setIsLoadingSocial] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setInlineError("")
    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setInlineError("이메일 또는 비밀번호를 확인해 주세요")
        } else if (response.status === 403) {
          setInlineError("탈퇴한 계정입니다")
        } else {
          setInlineError(result.error?.message || "로그인에 실패했습니다")
        }
        return
      }

      // 토큰 저장
      localStorage.setItem("accessToken", result.data.accessToken)
      localStorage.setItem("refreshToken", result.data.refreshToken)

      // 대시보드로 이동
      router.push("/")
    } catch (error) {
      setInlineError("네트워크 오류가 발생했습니다")
      console.error("[v0] Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    setIsLoadingSocial(true)
    try {
      // TODO: OAuth 리다이렉트
      console.log(`[v0] Initiating ${provider} login`)
      // window.location.href = `http://localhost:8080/auth/${provider}/login`
    } finally {
      setIsLoadingSocial(false)
    }
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
          <p className="text-sm text-muted-foreground">AI 면접 분석 플랫폼</p>
        </div>

        {/* Form Card */}
        <Card className="border-border/50 bg-card shadow-xl">
          <CardContent className="pt-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">로그인</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
              {/* Inline Error */}
              {inlineError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3">
                  <p className="text-sm text-rose-400">{inlineError}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">이메일</label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="이메일을 입력하세요"
                  className="border-border/50 bg-secondary/30"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-rose-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">비밀번호</label>
                <div className="relative">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    className="border-border/50 bg-secondary/30 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-400">{errors.password.message}</p>
                )}
              </div>

              {/* Links Row */}
              <div className="flex items-center justify-between text-xs">
                <Link href="/find-email" className="text-muted-foreground hover:text-primary transition-colors">
                  이메일 찾기
                </Link>
                <span className="text-border">|</span>
                <Link href="/find-password" className="text-muted-foreground hover:text-primary transition-colors">
                  비밀번호 찾기
                </Link>
                <span className="text-border">|</span>
                <Link href="/signup" className="text-muted-foreground hover:text-primary transition-colors">
                  회원가입
                </Link>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading || isLoadingSocial}
                className="w-full gap-2 bg-gradient-to-r from-primary to-violet-600 py-6 text-base font-semibold text-white shadow-lg shadow-primary/30 hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  <>
                    로그인
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">또는 소셜 로그인</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Google */}
              <Button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading || isLoadingSocial}
                variant="outline"
                className="gap-2 border-border/50 py-5 bg-white text-foreground hover:bg-gray-50"
              >
                {isLoadingSocial ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <text x="12" y="18" fontSize="16" fontWeight="bold" fill="#1F2937" textAnchor="middle">G</text>
                  </svg>
                )}
                <span className="text-sm font-medium">Google</span>
              </Button>

              {/* Kakao */}
              <Button
                type="button"
                onClick={() => handleSocialLogin("kakao")}
                disabled={isLoading || isLoadingSocial}
                className="gap-2 py-5 text-foreground"
                style={{ backgroundColor: "#FEE500" }}
              >
                {isLoadingSocial ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <text x="12" y="18" fontSize="16" fontWeight="bold" fill="#1F2937" textAnchor="middle">K</text>
                  </svg>
                )}
                <span className="text-sm font-medium">Kakao</span>
              </Button>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              로그인함으로써{" "}
              <Link href="#" className="hover:text-foreground transition-colors underline">
                이용약관
              </Link>
              과{" "}
              <Link href="#" className="hover:text-foreground transition-colors underline">
                개인정보처리방침
              </Link>
              에 동의합니다
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
