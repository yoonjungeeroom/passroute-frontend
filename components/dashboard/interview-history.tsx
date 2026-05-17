"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, History, RotateCcw, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

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

const interviews: Interview[] = [
  {
    id: "1",
    company: "삼성전자",
    companyColor: "bg-blue-500",
    role: "프론트엔드 개발자",
    stage: "기술 면접",
    date: "2026.03.28",
    score: 87,
  },
  {
    id: "2",
    company: "카카오",
    companyColor: "bg-yellow-500",
    role: "백엔드 개발자",
    stage: "실무 면접",
    date: "2026.03.26",
    score: 92,
  },
  {
    id: "3",
    company: "네이버",
    companyColor: "bg-green-500",
    role: "풀스택 개발자",
    stage: "임원 면접",
    date: "2026.03.24",
    score: 78,
  },
  {
    id: "4",
    company: "라인",
    companyColor: "bg-emerald-500",
    role: "iOS 개발자",
    stage: "인성 면접",
    date: "2026.03.22",
    score: 85,
  },
  {
    id: "5",
    company: "쿠팡",
    companyColor: "bg-orange-500",
    role: "데이터 엔지니어",
    stage: "직무 면접",
    date: "2026.03.20",
    score: 81,
  },
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

export function InterviewHistory() {
  const router = useRouter()
  
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <History className="h-4.5 w-4.5 text-primary" />
          최근 면접 이력
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/history")}
        >
          전체보기
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
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
              {interviews.map((interview) => (
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
  )
}
