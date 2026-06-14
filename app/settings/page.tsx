"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Loader2, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { getUserProfile, updateUserProfile, withdrawUser, type UserProfile } from "@/lib/api/user"
import { JOB_TYPES, EXPERIENCE_YEARS } from "@/lib/auth-config"

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [experienceYears, setExperienceYears] = useState<number>(0)
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([])
  const [preferredCompanies, setPreferredCompanies] = useState<string[]>([])
  const [companyInput, setCompanyInput] = useState("")
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getUserProfile()
        setProfile(data)
        setExperienceYears(data.experienceYears ?? 0)
        setPreferredJobTypes(data.preferredJobTypes ?? [])
        setPreferredCompanies(data.preferredCompanies ?? [])
      } catch {
        // 프로필 로딩 실패
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateUserProfile({
        experienceYears,
        preferredJobTypes,
        preferredCompanies,
      })
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // 저장 실패
    } finally {
      setSaving(false)
    }
  }

  const handleToggleJobType = (jobType: string) => {
    setPreferredJobTypes(prev =>
      prev.includes(jobType)
        ? prev.filter(j => j !== jobType)
        : prev.length < 5 ? [...prev, jobType] : prev
    )
  }

  const handleAddCompany = () => {
    const trimmed = companyInput.trim()
    if (trimmed && !preferredCompanies.includes(trimmed) && preferredCompanies.length < 10) {
      setPreferredCompanies(prev => [...prev, trimmed])
      setCompanyInput("")
    }
  }

  const handleRemoveCompany = (company: string) => {
    setPreferredCompanies(prev => prev.filter(c => c !== company))
  }

  const handleWithdraw = async () => {
    setShowWithdrawDialog(false)
    try {
      await withdrawUser()
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      router.push("/login")
    } catch {
      // 탈퇴 실패
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="w-full overflow-auto lg:ml-64">
          <MobileHeader />
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  const initials = profile?.name?.slice(0, 2) ?? "—"

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />

      <main className="pt-14 lg:pl-64 lg:pt-0">
        {/* 페이지 헤더 */}
        <div className="sticky top-14 z-20 border-b border-border/30 bg-background/95 backdrop-blur-sm lg:top-0">
          <div className="px-6 pb-5 pt-8 lg:px-8">
            <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">설정</h1>
            <p className="mt-1 text-sm text-muted-foreground">프로필 정보를 관리하세요</p>
          </div>
        </div>

        <div className="px-6 py-6 lg:px-8 space-y-5 max-w-2xl">

          {/* ── 프로필 카드 ── */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-5 text-[15px] font-extrabold text-foreground">프로필</h2>

            {/* 아바타 + 이름/이메일 */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[17px] font-bold text-foreground">{profile?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{profile?.email ?? "—"}</p>
              </div>
            </div>

            {/* 전화번호 / 가입일 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="mb-0.5 text-[11px] text-muted-foreground">전화번호</p>
                <p className="text-sm font-semibold text-foreground">
                  {profile?.phone
                    ? profile.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="mb-0.5 text-[11px] text-muted-foreground">가입일</p>
                <p className="text-sm font-semibold text-foreground">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("ko-KR")
                    : "—"}
                </p>
              </div>
            </div>
          </section>

          {/* ── 직무 설정 카드 ── */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-6 text-[15px] font-extrabold text-foreground">직무 설정</h2>

            <div className="space-y-7">
              {/* 경력 */}
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">경력</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.entries(EXPERIENCE_YEARS) as [string, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setExperienceYears(Number(value))}
                      className={[
                        "h-10 rounded-xl border text-sm font-semibold transition-all",
                        experienceYears === Number(value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 관심 직군 */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">관심 직군</p>
                  <span className="text-xs text-muted-foreground">
                    {preferredJobTypes.length}/5 선택
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {(Object.entries(JOB_TYPES) as [string, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleToggleJobType(value)}
                      className={[
                        "h-10 rounded-xl border text-xs font-semibold transition-all",
                        preferredJobTypes.includes(value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 관심 기업 */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">관심 기업</p>
                  <span className="text-xs text-muted-foreground">
                    최대 10개
                  </span>
                </div>

                {/* 기업 태그 */}
                {preferredCompanies.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {preferredCompanies.map((company) => (
                      <span
                        key={company}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        {company}
                        <button
                          type="button"
                          onClick={() => handleRemoveCompany(company)}
                          className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-primary/20 transition-colors"
                          aria-label={`${company} 제거`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* 기업 입력 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCompany()}
                    placeholder="기업명 입력 후 Enter"
                    className="h-10 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddCompany}
                    className="h-10 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saved ? "저장됐어요 ✓" : saving ? "저장 중..." : "변경사항 저장"}
            </button>
          </section>

          {/* ── 위험 영역 ── */}
          <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6 mb-12">
            <h2 className="mb-3 text-[15px] font-extrabold text-red-900">위험 영역</h2>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-900">계정 탈퇴</p>
                <p className="mt-0.5 text-xs text-red-700/70">모든 데이터가 영구 삭제됩니다</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawDialog(true)}
                className="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                탈퇴하기
              </button>
            </div>
          </section>

        </div>
      </main>

      {/* 탈퇴 확인 다이얼로그 */}
      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>계정 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>
              정말 탈퇴하시겠습니까? 모든 데이터가 영구 삭제되며 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleWithdraw}
            >
              탈퇴
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
