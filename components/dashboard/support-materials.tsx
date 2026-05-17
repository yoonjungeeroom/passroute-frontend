"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenTool, Building2, Plus, ChevronRight, Pencil, Play, Link2, FileText, Briefcase } from "lucide-react"
import { SelfIntroModal } from "./self-intro-modal"

interface SelfIntroduction {
  id: string
  company: string
  role: string
  experience: string
  questionCount: number
  hasJd: boolean
  hasJobPostingUrl: boolean
  lastUpdated: string
}

const selfIntroductions: SelfIntroduction[] = [
  {
    id: "1",
    company: "카카오",
    role: "AI 엔지니어",
    experience: "신입",
    questionCount: 4,
    hasJd: true,
    hasJobPostingUrl: true,
    lastUpdated: "2026.03.28",
  },
  {
    id: "2",
    company: "네이버",
    role: "프론트엔드 개발자",
    experience: "신입",
    questionCount: 5,
    hasJd: true,
    hasJobPostingUrl: false,
    lastUpdated: "2026.03.25",
  },
  {
    id: "3",
    company: "삼성전자",
    role: "소프트웨어 엔지니어",
    experience: "경력 2년",
    questionCount: 6,
    hasJd: false,
    hasJobPostingUrl: true,
    lastUpdated: "2026.03.20",
  },
]

export function SupportMaterials() {
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    setEditingId(id)
    setIsSheetOpen(true)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setIsSheetOpen(true)
  }

  return (
    <>
      <Card className="border-[var(--color-border)] bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
            <PenTool className="h-4.5 w-4.5 text-[var(--color-accent)]" />
            자기소개서
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            onClick={() => router.push("/self-intro")}
          >
            전체보기
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selfIntroductions.map((intro) => (
              <div
                key={intro.id}
                className="group relative flex flex-col rounded-xl border border-[var(--color-border)] bg-white p-4 transition-all duration-300 hover:border-[var(--color-accent)]"
              style={{ borderColor: 'var(--color-border)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-primary)' }}>
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-[var(--color-text)]">{intro.company}</h4>
                      <p className="flex items-center gap-1 truncate text-xs text-[var(--color-text-muted)]">
                        <Briefcase className="h-3 w-3" />
                        {intro.role}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-[var(--color-border)] bg-white text-[10px] text-[var(--color-text-muted)]">
                    {intro.experience}
                  </Badge>
                </div>

                {/* Info */}
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <Badge variant="outline" className="border-[var(--color-border)] bg-white gap-1">
                    <FileText className="h-3 w-3" />
                    {intro.questionCount}개 문항
                  </Badge>
                  {intro.hasJd && (
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-700">
                      JD
                    </Badge>
                  )}
                  {intro.hasJobPostingUrl && (
                    <Badge variant="outline" className="border-blue-300 bg-blue-100 text-[var(--color-primary)]">
                      <Link2 className="h-3 w-3" />
                    </Badge>
                  )}
                </div>

                <p className="mb-3 text-xs text-[var(--color-text-muted)]">{intro.lastUpdated} 업데이트</p>

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 gap-1 border-[var(--color-border)] bg-white text-xs text-[var(--color-text)]"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    onClick={() => handleEdit(intro.id)}
                  >
                    <Pencil className="h-3 w-3" />
                    수정
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1 bg-[var(--color-primary)] text-xs text-white hover:opacity-90"
                  >
                    <Play className="h-3 w-3" />
                    면접 시작
                  </Button>
                </div>
              </div>
            ))}

            {/* Add New Card */}
            <button
              onClick={handleAddNew}
              className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-white p-4 text-[var(--color-text-muted)] transition-all duration-300 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              style={{ backgroundColor: 'var(--color-surface)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-current">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">새 자기소개서 추가</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <SelfIntroModal
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        editMode={editingId !== null}
      />
    </>
  )
}
