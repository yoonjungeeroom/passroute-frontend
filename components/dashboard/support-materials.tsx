"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronRight, Pencil, Play, FileText, Briefcase, Loader2 } from "lucide-react"
import { SelfIntroModal } from "./self-intro-modal"
import { getSelfIntroList, type SelfIntroResponse } from "@/lib/api/self-intro"

const careerLevelLabels: Record<string, string> = {
  INTERN: "인턴",
  JUNIOR: "주니어",
  SENIOR: "시니어",
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

interface SupportMaterialsProps {
  onStartInterview?: (introId: number) => void
}

export function SupportMaterials({ onStartInterview }: SupportMaterialsProps) {
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selfIntros, setSelfIntros] = useState<SelfIntroResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSelfIntros()
  }, [])

  async function fetchSelfIntros() {
    try {
      const data = await getSelfIntroList()
      setSelfIntros(data.slice(0, 3))
    } catch {
      setSelfIntros([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string) => {
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
    <>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h3 className="text-[22px] font-extrabold tracking-tight text-slate-900">자기소개서</h3>
          <button onClick={() => router.push("/self-intro")} className="flex items-center gap-0.5 text-xs font-semibold text-slate-400 hover:text-slate-600">
            전체보기 <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-10">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selfIntros.map((intro) => (
              <div key={intro.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-base font-extrabold text-slate-500">{intro.companyName.slice(0, 1)}</span>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-slate-900">{intro.companyName}</h4>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-400"><Briefcase size={12} /> {intro.jobPosition}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">{careerLevelLabels[intro.careerLevel] ?? intro.careerLevel}</span>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500"><FileText size={11} /> {intro.itemCount}개 문항</span>
                  <span className="text-[11px] text-slate-300">·</span>
                  <span className="text-[11px] text-slate-400">{formatDate(intro.updatedAt)} 업데이트</span>
                </div>
                <div className="mt-auto flex gap-2">
                  <button onClick={() => handleEdit(String(intro.id))} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <Pencil size={13} /> 수정
                  </button>
                  <button onClick={() => onStartInterview?.(intro.id)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800">
                    <Play size={12} fill="currentColor" strokeWidth={0} /> 면접 시작
                  </button>
                </div>
              </div>
            ))}

            <button onClick={handleAddNew} className="flex min-h-[176px] flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 transition-colors hover:border-blue-400 hover:text-blue-500">
              <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-dashed border-current"><Plus size={22} /></span>
              <span className="text-sm font-bold">새 자기소개서 추가</span>
            </button>
          </div>
        )}
      </section>

      <SelfIntroModal open={isSheetOpen} onOpenChange={handleModalClose} editMode={editingId !== null} />
    </>
  )
}
