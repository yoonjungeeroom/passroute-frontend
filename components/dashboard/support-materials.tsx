"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenTool, Plus, ChevronRight, Pencil, Play, FileText, Briefcase, Loader2 } from "lucide-react"
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-muted)]" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selfIntros.map((intro) => (
                <div
                  key={intro.id}
                  className="group relative flex flex-col rounded-xl border border-[var(--color-border)] bg-white p-4 transition-all duration-300 hover:border-[var(--color-accent)]"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold text-muted-foreground">
                        {intro.companyName.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-[var(--color-text)]">{intro.companyName}</h4>
                        <p className="flex items-center gap-1 truncate text-xs text-[var(--color-text-muted)]">
                          <Briefcase className="h-3 w-3" />
                          {intro.jobPosition}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-[var(--color-border)] bg-white text-[10px] text-[var(--color-text-muted)]">
                      {careerLevelLabels[intro.careerLevel] ?? intro.careerLevel}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Badge variant="outline" className="border-[var(--color-border)] bg-white gap-1">
                      <FileText className="h-3 w-3" />
                      {intro.itemCount}개 문항
                    </Badge>
                  </div>

                  <p className="mb-3 text-xs text-[var(--color-text-muted)]">{formatDate(intro.updatedAt)} 업데이트</p>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 gap-1 border-[var(--color-border)] bg-white text-xs text-[var(--color-text)]"
                      onClick={() => handleEdit(String(intro.id))}
                    >
                      <Pencil className="h-3 w-3" />
                      수정
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1 bg-[var(--color-primary)] text-xs text-white hover:opacity-90"
                      onClick={() => onStartInterview?.(intro.id)}
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
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-current">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">새 자기소개서 추가</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <SelfIntroModal
        open={isSheetOpen}
        onOpenChange={handleModalClose}
        editMode={editingId !== null}
      />
    </>
  )
}
