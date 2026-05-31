"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Button } from "@/components/ui/button"
import { Settings, Loader2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { getUserProfile, updateUserProfile, withdrawUser, type UserProfile } from "@/lib/api/user"
import { JOB_TYPES, EXPERIENCE_YEARS } from "@/lib/auth-config"

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [experienceYears, setExperienceYears] = useState<number>(0)
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([])
  const [preferredCompanies, setPreferredCompanies] = useState<string[]>([])
  const [companyInput, setCompanyInput] = useState("")

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

  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)

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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="w-full overflow-auto lg:ml-64">
        <MobileHeader />
        <div className="sticky top-14 z-30 border-b border-border/30 bg-background/95 backdrop-blur-sm lg:top-0">
          <div className="px-4 pt-8 pb-5 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">설정</h1>
            <p className="text-sm text-muted-foreground mt-1">프로필 정보를 관리하세요</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          {/* Profile Card */}
          <div className="rounded-xl border border-border bg-white p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-7">프로필</h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold shrink-0">
                {profile?.name?.slice(0, 2) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-foreground">{profile?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{profile?.email ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-0.5">전화번호</p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.phone ? profile.phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3") : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-0.5">가입일</p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("ko-KR") : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="rounded-xl border border-border bg-white p-8 mb-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-7">직무 설정</h3>

            <div className="space-y-6">
              {/* Experience Years */}
              <div className="space-y-5">
                <label className="text-sm font-medium text-foreground">경력</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
                  {Object.entries(EXPERIENCE_YEARS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setExperienceYears(Number(value))}
                      className={`h-10 rounded-xl border text-sm font-medium transition-all ${
                        experienceYears === Number(value)
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Job Types */}
              <div className="space-y-5">
                <label className="text-sm font-medium text-foreground">
                  관심 직군 <span className="text-xs text-muted-foreground">(최대 5개)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-2">
                  {Object.entries(JOB_TYPES).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => handleToggleJobType(value)}
                      className={`h-11 rounded-xl border text-xs font-medium transition-all ${
                        preferredJobTypes.includes(value)
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Companies */}
              <div className="space-y-5">
                <label className="text-sm font-medium text-foreground">
                  관심 기업 <span className="text-xs text-muted-foreground">(최대 10개)</span>
                </label>
                {preferredCompanies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferredCompanies.map((company) => (
                      <span
                        key={company}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {company}
                        <button onClick={() => handleRemoveCompany(company)} className="hover:text-primary/70">
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCompany()}
                    placeholder="기업명 입력 후 Enter"
                    className="flex-1 h-11 rounded-xl border border-border bg-white px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  />
                  <Button variant="outline" className="h-11 rounded-xl" onClick={handleAddCompany}>추가</Button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 text-sm font-semibold mt-6"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {saving ? "저장 중..." : "변경사항 저장"}
            </Button>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 mb-12">
            <h3 className="text-lg font-bold text-red-900 mb-3">위험 영역</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-900">계정 탈퇴</p>
                <p className="text-xs text-red-700/70 mt-0.5">모든 데이터가 영구 삭제됩니다</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWithdrawDialog(true)}
                className="border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
              >
                탈퇴하기
              </Button>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>계정 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>정말 탈퇴하시겠습니까? 모든 데이터가 영구 삭제되며 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleWithdraw}>탈퇴</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
