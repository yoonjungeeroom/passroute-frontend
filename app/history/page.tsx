"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { History, FileText, RotateCcw, Search, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

type InterviewStage = "인성 면접" | "직무 면접" | "실무 면접" | "임원 면접" | "기술 면접"

interface Interview {
  id: string
  company: string
  companyColor: string
  role: string
  stage: InterviewStage
  date: string
  score: number
}

const allInterviews: Interview[] = [
  { id: "1", company: "삼성전자", companyColor: "bg-blue-500", role: "프론트엔드 개발자", stage: "기술 면접", date: "2026.03.28", score: 87 },
  { id: "2", company: "카카오", companyColor: "bg-yellow-500", role: "백엔드 개발자", stage: "실무 면접", date: "2026.03.26", score: 92 },
  { id: "3", company: "네이버", companyColor: "bg-green-500", role: "풀스택 개발자", stage: "임원 면접", date: "2026.03.24", score: 78 },
  { id: "4", company: "라인", companyColor: "bg-emerald-500", role: "iOS 개발자", stage: "인성 면접", date: "2026.03.22", score: 85 },
  { id: "5", company: "쿠팡", companyColor: "bg-orange-500", role: "데이터 엔지니어", stage: "직무 면접", date: "2026.03.20", score: 81 },
  { id: "6", company: "토스", companyColor: "bg-blue-600", role: "서버 개발자", stage: "기술 면접", date: "2026.03.18", score: 89 },
  { id: "7", company: "당근마켓", companyColor: "bg-orange-400", role: "백엔드 개발자", stage: "실무 면접", date: "2026.03.15", score: 76 },
  { id: "8", company: "배달의민족", companyColor: "bg-cyan-500", role: "프론트엔드 개발자", stage: "인성 면접", date: "2026.03.12", score: 83 },
  { id: "9", company: "삼성전자", companyColor: "bg-blue-500", role: "SW 개발자", stage: "임원 면접", date: "2026.03.10", score: 90 },
  { id: "10", company: "네이버", companyColor: "bg-green-500", role: "AI 엔지니어", stage: "기술 면접", date: "2026.03.08", score: 72 },
]

const stageConfig: Record<InterviewStage, string> = {
  "인성 면접": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "직무 면접": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "실무 면접": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "임원 면접": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "기술 면접": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400"
  if (score >= 80) return "text-primary"
  if (score >= 70) return "text-amber-400"
  return "text-muted-foreground"
}

export default function HistoryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")

  const filteredInterviews = allInterviews.filter((interview) => {
    const matchesSearch = 
      interview.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStage = stageFilter === "all" || interview.stage === stageFilter
    return matchesSearch && matchesStage
  })

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />
      
      <main className="pt-14 lg:pl-64 lg:pt-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="h-4 w-4" />
              대시보드로 돌아가기
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              면접 이력
            </h1>
            <p className="mt-1 text-muted-foreground">
              지금까지 진행한 모든 면접 기록을 확인하세요
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-border/50 bg-card">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="회사명 또는 직무 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-border/50 bg-secondary/30 pl-9"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full border-border/50 bg-secondary/30 sm:w-[180px]">
                  <SelectValue placeholder="면접 단계" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 단계</SelectItem>
                  <SelectItem value="인성 면접">인성 면접</SelectItem>
                  <SelectItem value="직무 면접">직무 면접</SelectItem>
                  <SelectItem value="실무 면접">실무 면접</SelectItem>
                  <SelectItem value="임원 면접">임원 면접</SelectItem>
                  <SelectItem value="기술 면접">기술 면접</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <History className="h-4.5 w-4.5 text-primary" />
                전체 면접 이력
                <Badge variant="secondary" className="ml-2">
                  {filteredInterviews.length}건
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">회사 / 직무</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">면접 단계</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">점수</TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">날짜</TableHead>
                      <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInterviews.map((interview) => (
                      <TableRow key={interview.id} className="group border-border/30 transition-colors hover:bg-secondary/30">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className={cn("h-8 w-8 shrink-0 rounded-lg", interview.companyColor)} />
                            <div>
                              <p className="font-medium text-foreground">{interview.company}</p>
                              <p className="text-sm text-muted-foreground">{interview.role}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("font-medium", stageConfig[interview.stage])}>
                            {interview.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-lg font-bold", getScoreColor(interview.score))}>
                            {interview.score}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {interview.date}
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              다시하기
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-primary/20 hover:text-primary"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              리포트
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
