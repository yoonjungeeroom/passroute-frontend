"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/dashboard/top-nav"
import { SelfIntroModal } from "@/components/dashboard/self-intro-modal"
import { InterviewModal } from "@/components/dashboard/interview-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenTool, Plus, Pencil, Play, FileText, Briefcase, Loader2, BarChart3 } from "lucide-react"
import { getSelfIntroList, type SelfIntroResponse } from "@/lib/api/self-intro"
import { getUserProfile } from "@/lib/api/user"

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

const careerLevelLabels: Record<string, string> = {
  INTERN: "인턴",
  JUNIOR: "주니어",
  SENIOR: "시니어",
}

export default function SelfIntroPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selfIntros, setSelfIntros] = useState<SelfIntroResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
  const [interviewIntroId, setInterviewIntroId] = useState<number | null>(null)

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      getUserProfile()
        .then((u) => setUserName(u.name))
        .catch(() => {})
    }
    fetchSelfIntros()
  }, [])

  async function fetchSelfIntros() {
    setLoading(true)
    try {
      const data = await getSelfIntroList()
      setSelfIntros(data)
    } catch {
      setSelfIntros([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: number) => {
    setEditingId(id)
    setIsSheetOpen(true)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setIsSheetOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setIsSheetOpen(open)
    if (!open) fetchSelfIntros()
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <TopNav userName={userName} />

      <main className="mx-auto w-full max-w-[1040px] px-6 py-9">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">자기소개서</h1>
            <p className="mt-1 text-sm text-slate-500">전체 {selfIntros.length}개의 자기소개서</p>
          </div>
          <Button
            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleAddNew}
          >
            <Plus className="h-4 w-4" />
            새 자기소개서
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : selfIntros.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
            <PenTool className="mb-3 h-12 w-12 text-slate-200" />
            <p className="text-sm text-slate-400">자기소개서가 없습니다</p>
            <button
              onClick={handleAddNew}
              className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              새 자기소개서 작성하기
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selfIntros.map((intro) => (
              <div
                key={intro.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300"
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-base font-extrabold text-slate-500">
                      {intro.companyName.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-slate-900">{intro.companyName}</h4>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                        <Briefcase className="h-3 w-3" />
                        {intro.jobPosition}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-slate-200 bg-slate-50 text-[10px] text-slate-500">
                    {careerLevelLabels[intro.careerLevel] ?? intro.careerLevel}
                  </Badge>
                </div>

                {/* Meta */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    <FileText className="h-3 w-3" />
                    {intro.itemCount}개 문항
                  </span>
                  <span className="text-[11px] text-slate-300">·</span>
                  <span className="text-[11px] text-slate-400">{formatDate(intro.updatedAt)} 업데이트</span>
                </div>

                {/* Actions */}
                <div className="mt-auto space-y-2">
                  <button
                    onClick={() => router.push(`/reports/self-intro/${intro.id}`)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    리포트 보기
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(intro.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </button>
                    <button
                      onClick={() => { setInterviewIntroId(intro.id); setIsInterviewModalOpen(true) }}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700"
                    >
                      <Play className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                      면접 시작
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* 새 자기소개서 추가 카드 */}
            <button
              onClick={handleAddNew}
              className="flex min-h-[200px] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-blue-400 hover:text-blue-500"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-dashed border-current">
                <Plus size={22} />
              </span>
              <span className="text-sm font-bold">새 자기소개서 추가</span>
            </button>
          </div>
        )}
      </main>

      <InterviewModal
        open={isInterviewModalOpen}
        onOpenChange={setIsInterviewModalOpen}
        prefillData={interviewIntroId ? {
          introId: interviewIntroId,
          stage: "technical",
          mode: "one-on-one",
          practiceMode: "practice" as const,
          personas: ["TEAM_LEAD"],
        } : null}
      />
      <SelfIntroModal
        open={isSheetOpen}
        onOpenChange={handleModalClose}
        editMode={editingId !== null}
        editId={editingId}
      />
    </div>
  )
}
