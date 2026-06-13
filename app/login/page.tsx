"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Mic } from "lucide-react"
import { loginSchema, type LoginInput } from "@/lib/auth-schemas"

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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 왼쪽 브랜딩 패널 */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        {/* 배경 글로우 */}
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,.5), transparent 70%)" }} />
        <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,.18), transparent 70%)" }} />
        <div className="pointer-events-none absolute right-8 bottom-0 text-white opacity-[0.05]">
          <Mic size={240} strokeWidth={1} />
        </div>

        {/* 로고 */}
        <div className="relative">
          <span className="text-[22px] font-extrabold tracking-tight text-white">passroute</span>
        </div>

        {/* 중앙 카피 */}
        <div className="relative space-y-5">
          <h2 className="text-[36px] font-extrabold leading-[1.3] tracking-tight text-white">
            면접 준비의<br />
            <span className="text-blue-400">새로운 기준</span>
          </h2>
          <p className="max-w-xs text-[15px] leading-relaxed text-slate-300">
            AI 기반 실시간 면접 분석으로<br />실전 대응 능력을 향상시키세요.
          </p>
        </div>

        <div />
      </div>

      {/* 오른쪽 폼 패널 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* 모바일 로고 */}
        <div className="mb-8 lg:hidden">
          <span className="text-[22px] font-extrabold tracking-tight text-slate-900">passroute</span>
        </div>

        <div className="w-full max-w-[400px]">
          <h1 className="mb-2 text-[28px] font-extrabold tracking-tight text-slate-900">로그인</h1>
          <p className="mb-8 text-sm text-slate-400">계정에 로그인하세요</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {inlineError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm text-rose-500">{inlineError}</p>
              </div>
            )}

            {/* 이메일 */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">이메일</label>
              <input
                {...register("email")}
                type="email"
                placeholder="name@example.com"
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none transition-colors disabled:opacity-50"
              />
              {errors.email && (
                <p className="text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">비밀번호</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  disabled={isLoading}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500">{errors.password.message}</p>
              )}
            </div>

            {/* 이메일/비밀번호 찾기 */}
            <div className="flex items-center justify-between">
              <Link href="/find-email" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                이메일 찾기
              </Link>
              <Link href="/find-password" className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
                비밀번호 찾기
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-50 px-3 text-slate-400">or</span>
            </div>
          </div>

          {/* 소셜 로그인 */}
          <div className="flex justify-center gap-3">
            <a
              href="/api/oauth2/authorization/google"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white transition-colors hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </a>
            <a
              href="/api/oauth2/authorization/kakao"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white transition-colors hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M12 3C6.48 3 2 6.48 2 10.5c0 2.55 1.69 4.79 4.22 6.08-.13.47-.84 3.01-.87 3.21 0 0-.02.13.07.18.08.05.18.02.18.02.24-.03 2.78-1.82 3.22-2.13.38.05.77.08 1.18.08 5.52 0 10-3.48 10-7.94S17.52 3 12 3z" fill="#3C1E1E" />
              </svg>
            </a>
          </div>

          {/* 회원가입 */}
          <p className="mt-6 text-center text-sm text-slate-400">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
