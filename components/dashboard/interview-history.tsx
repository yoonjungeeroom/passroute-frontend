"use client"

import { useEffect, useState } from "react"
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
import { FileText, History, RotateCcw, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getHistoryList, retryInterview } from "@/lib/api/history"
import type { HistoryListResponse } from "@/types/history"

function getTypeLabel(type: string): string {
  return type === "TECHNICAL" ? "기술 면접" : "인성 면접"
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export function InterviewHistory() {
  const router = useRouter()
  const [histories, setHistories] = useState<HistoryListResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getHistoryList({ page: 0, size: 5 })
        setHistories(data.content)
      } catch {
        setHistories([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleRetry = async (roomId: number) => {
    try {
      const result = await retryInterview(roomId)
      router.push(`/interview?roomId=${result.roomId}`)
    } catch {
      // 재시도 실패
    }
  }

  return (
    <Card className="border-border bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <History className="h-4 w-4 text-muted-foreground" />
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : histories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <History className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">면접 이력이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">회사 / 직무</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">면접 유형</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">날짜</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {histories.map((item) => (
                  <TableRow key={item.roomId} className="group border-border/30 transition-colors hover:bg-background">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-xs font-semibold text-muted-foreground">
                          {item.companyName.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.companyName}</p>
                          <p className="text-sm text-muted-foreground">{item.jobPosition}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border bg-background font-medium text-muted-foreground">
                        {getTypeLabel(item.interviewType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleRetry(item.roomId)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          다시하기
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => router.push("/reports")}
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
        )}
      </CardContent>
    </Card>
  )
}
