"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { SelfIntroModal } from "@/components/dashboard/self-intro-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenTool, Plus, Pencil, Play, FileText, Briefcase, Loader2, BarChart3 } from "lucide-react"
import { getSelfIntroList, type SelfIntroResponse } from "@/lib/api/self-intro"

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
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const router = useRouter()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selfIntros, setSelfIntros] = useState<SelfIntroResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />

      <main className="pt-14 lg:pl-64 lg:pt-0">
        {/* Sticky Header */}
        <div className="sticky top-14 z-30 border-b border-border/30 bg-background/95 backdrop-blur-sm lg:top-0">
          <div className="flex items-center justify-between px-4 pt-8 pb-5 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">자기소개서</h1>
              <p className="text-sm text-muted-foreground mt-1">전체 {selfIntros.length}개의 자기소개서</p>
            </div>
            <Button
              className="gap-1.5 bg-primary text-white hover:opacity-90"
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4" />
              새 자기소개서
            </Button>
          </div>
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-8">

          {/* Self-intro List */}
          <Card className="border-border bg-white rounded-xl">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <PenTool className="h-4.5 w-4.5 text-primary" />
                전체 자기소개서
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selfIntros.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : selfIntros.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PenTool className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    자기소개서가 없습니다
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 text-primary"
                    onClick={handleAddNew}
                  >
                    새 자기소개서 작성하기
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selfIntros.map((intro) => (
                    <div
                      key={intro.id}
                      className="group relative flex flex-col rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-secondary/50"
                    >
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold text-muted-foreground">
                            {intro.companyName.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-foreground">{intro.companyName}</h4>
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <Briefcase className="h-3 w-3" />
                              {intro.jobPosition}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-border/50 bg-secondary/50 text-[10px]">
                          {careerLevelLabels[intro.careerLevel] ?? intro.careerLevel}
                        </Badge>
                      </div>

                      {/* Info */}
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="border-border/50 bg-secondary/50 gap-1">
                          <FileText className="h-3 w-3" />
                          {intro.itemCount}개 문항
                        </Badge>
                      </div>

                      <p className="mb-3 text-xs text-muted-foreground">{formatDate(intro.updatedAt)} 업데이트</p>

                      {/* Actions */}
                      <div className="mt-auto space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1 border-border/50 text-xs hover:bg-secondary/50"
                          onClick={() => router.push(`/reports/self-intro/${intro.id}`)}
                        >
                          <BarChart3 className="h-3 w-3" />
                          리포트 보기
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 gap-1 border-border/50 bg-secondary/80 text-xs hover:bg-secondary"
                            onClick={() => handleEdit(intro.id)}
                          >
                            <Pencil className="h-3 w-3" />
                            수정
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 gap-1 bg-primary text-xs text-white hover:opacity-90"
                            onClick={() => router.push(`/dashboard?startInterview=${intro.id}`)}
                          >
                            <Play className="h-3 w-3" />
                            면접 시작
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <SelfIntroModal
        open={isSheetOpen}
        onOpenChange={handleModalClose}
        editMode={editingId !== null}
        editId={editingId}
      />
    </div>
  )
}
