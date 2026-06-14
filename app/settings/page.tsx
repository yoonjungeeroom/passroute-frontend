"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/dashboard/top-nav"
import { Loader2, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getUserProfile, updateUserProfile, withdrawUser, type UserProfile } from "@/lib/api/user"
import { JOB_TYPES, EXPERIENCE_YEARS } from "@/lib/auth-config"
import { cn } from "@/lib/utils"

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
  const [userName, setUserName] = useState("")

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getUserProfile()
        setProfile(data)
        setUserName(data.name ?? "")
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
      <div className="min-h-screen w-full bg-slate-50">
        <TopNav userName={userName} />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <TopNav userName={userName} />

      <main className="mx-auto w-full max-w-[1040px] px-6 py-9">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">설정</h1>
          <p className="mt-1 text-sm text-slate-500">프로필 정보를 관리하세요</p>
        </div>

        <div className="flex flex-col gap-4 max-w-2xl">

          {/* ── 프로필 카드 ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-[15px] font-extrabold text-slate-900">프로필</h2>

            <div className="flex items-center gap-4 mb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {profile?.name?.slice(0, 2) ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="text-[17px] font-bold text-slate-900">{profile?.name ?? "—"}</p>
                <p className="text-sm text-slate-500">{profile?.email ?? "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="mb-0.5 text-[11px] text-slate-400">전화번호</p>
                <p className="text-sm font-semibold text-slate-900">
                  {profile?.phone
                    ? profile.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="mb-0.5 text-[11px] text-slate-400">가입일</p>
                <p className="text-sm font-semibold text-slate-900">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("ko-KR")
                    : "—"}
                </p>
              </div>
            </div>
          </section>

          {/* ── 직무 설정 카드 ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-[15px] font-extrabold text-slate-900">직무 설정</h2>

            <div className="space-y-7">
              {/* 경력 */}
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-900">경력</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.entries(EXPERIENCE_YEARS) as [string, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setExperienceYears(Number(value))}
                      className={cn(
                        "h-10 rounded-xl border text-sm font-semibold transition-all",
                        experienceYears === Number(value)
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-500 hover:border-blue-300 hover:text-slate-700"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 관심 직군 */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">관심 직군</p>
                  <span className="text-xs text-slate-400">{preferredJobTypes.length}/5 선택</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {(Object.entries(JOB_TYPES) as [string, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleToggleJobType(value)}
                      className={cn(
                        "h-10 rounded-xl border text-xs font-semibold transition-all",
                        preferredJobTypes.includes(value)
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-500 hover:border-blue-300 hover:text-slate-700"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 관심 기업 */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">관심 기업</p>
                  <span className="text-xs text-slate-400">최대 10개</span>
                </div>
                {preferredCompanies.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {preferredCompanies.map((company) => (
                      <span
                        key={company}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                      >
                        {company}
                        <button
                          type="button"
                          onClick={() => handleRemoveCompany(company)}
                          className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-blue-100"
                          aria-label={`${company} 제거`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCompany()}
                    placeholder="기업명 입력 후 Enter"
                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddCompany}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300"
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
              className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saved ? "저장됐어요 ✓" : saving ? "저장 중..." : "변경사항 저장"}
            </button>
          </section>

          {/* ── 위험 영역 ── */}
          <section className="rounded-2xl border border-red-200 bg-red-50/60 p-6 mb-12">
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

      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>
              정말 탈퇴하시겠습니까? 모든 데이터가 영구 삭제되며 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
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
