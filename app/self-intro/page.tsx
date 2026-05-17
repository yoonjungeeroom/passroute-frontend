"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { SelfIntroModal } from "@/components/dashboard/self-intro-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenTool, Building2, Plus, ChevronLeft, Pencil, Play, Link2, FileText, Briefcase, Filter, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelfIntroduction {
  id: string
  company: string
  role: string
  experience: string
  questionCount: number
  hasJd: boolean
  hasJobPostingUrl: boolean
  lastUpdated: string
  lastUpdatedDate: Date
}

const allSelfIntroductions: SelfIntroduction[] = [
  {
    id: "1",
    company: "카카오",
    role: "AI 엔지니어",
    experience: "신입",
    questionCount: 4,
    hasJd: true,
    hasJobPostingUrl: true,
    lastUpdated: "2026.03.28",
    lastUpdatedDate: new Date(2026, 2, 28),
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
    lastUpdatedDate: new Date(2026, 2, 25),
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
    lastUpdatedDate: new Date(2026, 2, 20),
  },
  {
    id: "4",
    company: "SK하이닉스",
    role: "반도체 공정 엔지니어",
    experience: "신입",
    questionCount: 4,
    hasJd: true,
    hasJobPostingUrl: true,
    lastUpdated: "2026.02.15",
    lastUpdatedDate: new Date(2026, 1, 15),
  },
  {
    id: "5",
    company: "LG전자",
    role: "임베디드 소프트웨어 개발자",
    experience: "경력 3년",
    questionCount: 5,
    hasJd: true,
    hasJobPostingUrl: false,
    lastUpdated: "2026.02.10",
    lastUpdatedDate: new Date(2026, 1, 10),
  },
  {
    id: "6",
    company: "현대자동차",
    role: "자율주행 연구원",
    experience: "경력 5년",
    questionCount: 7,
    hasJd: true,
    hasJobPostingUrl: true,
    lastUpdated: "2026.01.05",
    lastUpdatedDate: new Date(2026, 0, 5),
  },
]

type PeriodFilter = "1month" | "2months" | "all"

const periodFilterConfig: Record<PeriodFilter, { label: string; months: number | null }> = {
  "1month": { label: "1개월", months: 1 },
  "2months": { label: "2개월", months: 2 },
  "all": { label: "전체", months: null },
}

export default function SelfIntroPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")

  const filteredSelfIntroductions = useMemo(() => {
    const config = periodFilterConfig[periodFilter]
    if (!config.months) return allSelfIntroductions

    const now = new Date(2026, 3, 2) // Current date in app context
    const cutoffDate = new Date(now)
    cutoffDate.setMonth(cutoffDate.getMonth() - config.months)

    return allSelfIntroductions.filter(intro => intro.lastUpdatedDate >= cutoffDate)
  }, [periodFilter])

  const handleEdit = (id: string) => {
    setEditingId(id)
    setIsSheetOpen(true)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setIsSheetOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />
      
      <main className="pt-14 lg:pl-64 lg:pt-0">
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground lg:text-2xl">자기소개서</h1>
                <p className="text-sm text-muted-foreground">전체 {allSelfIntroductions.length}개의 자기소개서</p>
              </div>
            </div>
            <Button 
              className="gap-1.5 bg-gradient-to-r from-primary to-violet-600 text-white hover:opacity-90"
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4" />
              새 자기소개서
            </Button>
          </div>

          {/* Self-intro List */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <PenTool className="h-4.5 w-4.5 text-primary" />
                  전체 자기소개서
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filteredSelfIntroductions.length}
                  </Badge>
                </CardTitle>

                {/* Period Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <div className="flex rounded-lg border border-border/50 bg-secondary/30 p-0.5">
                    {(Object.keys(periodFilterConfig) as PeriodFilter[]).map((filter) => (
                      <Button
                        key={filter}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 px-3 text-xs transition-all",
                          periodFilter === filter
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setPeriodFilter(filter)}
                      >
                        {periodFilterConfig[filter].label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSelfIntroductions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    선택한 기간에 해당하는 자기소개서가 없습니다
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="mt-2 text-primary"
                    onClick={() => setPeriodFilter("all")}
                  >
                    전체 보기
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSelfIntroductions.map((intro) => (
                    <div
                      key={intro.id}
                      className="group relative flex flex-col rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-secondary/50"
                    >
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
                            <Building2 className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-foreground">{intro.company}</h4>
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <Briefcase className="h-3 w-3" />
                              {intro.role}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-border/50 bg-secondary/50 text-[10px]">
                          {intro.experience}
                        </Badge>
                      </div>

                      {/* Info */}
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="border-border/50 bg-secondary/50 gap-1">
                          <FileText className="h-3 w-3" />
                          {intro.questionCount}개 문항
                        </Badge>
                        {intro.hasJd && (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                            JD
                          </Badge>
                        )}
                        {intro.hasJobPostingUrl && (
                          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400">
                            <Link2 className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>

                      <p className="mb-3 text-xs text-muted-foreground">{intro.lastUpdated} 업데이트</p>

                      {/* Actions */}
                      <div className="mt-auto flex gap-2">
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
                          className="flex-1 gap-1 bg-gradient-to-r from-primary to-violet-600 text-xs text-white hover:opacity-90"
                        >
                          <Play className="h-3 w-3" />
                          면접 시작
                        </Button>
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
        onOpenChange={setIsSheetOpen}
        editMode={editingId !== null}
      />
    </div>
  )
}
