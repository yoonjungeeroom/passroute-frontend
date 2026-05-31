"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { loginSchema, type LoginInput } from "@/lib/auth-schemas"
import { AuthBrandingPanel } from "@/components/auth-branding-panel"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [inlineError, setInlineError] = useState("")
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setInlineError("")
    try {
      const response = await fetch(`/auth/login`, {
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
          setInlineError(result.message || "로그인에 실패했습니다")
        }
        return
      }

      localStorage.setItem("accessToken", result.data.accessToken)
      localStorage.setItem("refreshToken", result.data.refreshToken)
      router.push("/dashboard")
    } catch {
      setInlineError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.")
      return
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row md:h-160">
        <AuthBrandingPanel
          subtitle={"면접 준비의\n새로운 기준"}
          description="AI 기반 실시간 면접 분석으로 실전 대응 능력을 향상시키세요."
        />

        {/* Right Panel — Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center overflow-y-auto scrollbar-hide">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">passroute</h1>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-8">로그인</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {inlineError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-3">
                <p className="text-sm text-rose-500">{inlineError}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground mb-1">이메일</label>
              <Input
                {...register("email")}
                type="email"
                placeholder="name@example.com"
                className="h-11 border-border bg-background"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground mb-1">비밀번호</label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
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
              {errors.password && (
                <p className="text-xs text-rose-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link href="/find-email" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                이메일 찾기
              </Link>
              <Link href="/find-password" className="text-xs text-primary hover:underline transition-colors">
                비밀번호 찾기
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-sm font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="flex justify-center gap-4">
            <a
              href="/api/oauth2/authorization/google"
              className="flex items-center justify-center w-11 h-11 rounded-full border border-border hover:bg-muted/50 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </a>
            <a
              href="/api/oauth2/authorization/kakao"
              className="flex items-center justify-center w-11 h-11 rounded-full border border-border hover:bg-muted/50 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M12 3C6.48 3 2 6.48 2 10.5c0 2.55 1.69 4.79 4.22 6.08-.13.47-.84 3.01-.87 3.21 0 0-.02.13.07.18.08.05.18.02.18.02.24-.03 2.78-1.82 3.22-2.13.38.05.77.08 1.18.08 5.52 0 10-3.48 10-7.94S17.52 3 12 3z" fill="#3C1E1E" />
              </svg>
            </a>
          </div>

          {/* Signup link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline transition-colors">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
