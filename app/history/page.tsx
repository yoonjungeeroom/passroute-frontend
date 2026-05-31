"use client"

import React, { useState, useEffect } from "react"
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
import { History, FileText, RotateCcw, Search, ArrowLeft, Loader2, ChevronDown, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { getHistoryList, searchHistory, retryInterview, getHistoryDetail } from "@/lib/api/history"
import type { HistoryListResponse, HistoryDetailResponse } from "@/types/history"

const typeConfig: Record<string, string> = {
  TECHNICAL: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PERSONALITY: "bg-pink-500/20 text-pink-400 border-pink-500/30",
}

function getTypeLabel(type: string): string {
  return type === "TECHNICAL" ? "기술 면접" : "인성 면접"
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export default function HistoryPage() {
  const router = useRouter()
  const [histories, setHistories] = useState<HistoryListResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [expandedRoomId, setExpandedRoomId] = useState<number | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<HistoryDetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchHistories()
  }, [typeFilter])

  async function fetchHistories() {
    setLoading(true)
    try {
      if (searchQuery.trim()) {
        const data = await searchHistory({ keyword: searchQuery, size: 50 })
        setHistories(data.content)
      } else {
        const params: { type?: "TECHNICAL" | "PERSONALITY"; size?: number } = { size: 50 }
        if (typeFilter !== "all") {
          params.type = typeFilter as "TECHNICAL" | "PERSONALITY"
        }
        const data = await getHistoryList(params)
        setHistories(data.content)
      }
    } catch {
      setHistories([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchHistories()
  }

  const handleRetry = async (roomId: number) => {
    try {
      const result = await retryInterview(roomId)
      router.push(`/interview?roomId=${result.roomId}`)
    } catch {
      // 재시도 실패
    }
  }

  const handleExpandRow = async (roomId: number) => {
    if (expandedRoomId === roomId) {
      setExpandedRoomId(null)
      setExpandedDetail(null)
      return
    }
    setExpandedRoomId(roomId)
    setDetailLoading(true)
    try {
      const detail = await getHistoryDetail(roomId)
      setExpandedDetail(detail)
    } catch {
      setExpandedDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

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
              onClick={() => router.push("/dashboard")}
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
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="border-border/50 bg-secondary/30 pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full border-border/50 bg-secondary/30 sm:w-[180px]">
                  <SelectValue placeholder="면접 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="TECHNICAL">기술 면접</SelectItem>
                  <SelectItem value="PERSONALITY">인성 면접</SelectItem>
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
                  {histories.length}건
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : histories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <History className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">면접 이력이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="pl-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">회사 / 직무</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">면접 유형</TableHead>
                        <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">날짜</TableHead>
                        <TableHead className="pr-6 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {histories.map((item) => (
                        <React.Fragment key={item.roomId}>
                          <TableRow
                            className="group cursor-pointer border-border/30 transition-colors hover:bg-secondary/30"
                            onClick={() => handleExpandRow(item.roomId)}
                          >
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
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("font-medium", typeConfig[item.interviewType] ?? "")}>
                                  {getTypeLabel(item.interviewType)}
                                </Badge>
                                {item.interviewFormat === "DEBATE" && (
                                  <Badge variant="outline" className="text-xs">다대다</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatDate(item.createdAt)}
                            </TableCell>
                            <TableCell className="pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                                  onClick={(e) => { e.stopPropagation(); handleRetry(item.roomId) }}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  다시하기
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-primary/20 hover:text-primary"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/reports?type=${item.interviewFormat === "DEBATE" ? "debate" : "interview"}`) }}
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  리포트
                                </Button>
                                <ChevronDown className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform",
                                  expandedRoomId === item.roomId && "rotate-180"
                                )} />
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Detail */}
                          {expandedRoomId === item.roomId && (
                            <TableRow className="border-border/30 bg-secondary/10">
                              <TableCell colSpan={4} className="px-6 py-4">
                                {detailLoading ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                  </div>
                                ) : expandedDetail ? (
                                  <div className="space-y-4">
                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                      <span>난이도: <strong className="text-foreground">{expandedDetail.difficulty}</strong></span>
                                      <span>면접관: <strong className="text-foreground">{expandedDetail.aiInterviewer}</strong></span>
                                      <span>세션 수: <strong className="text-foreground">{expandedDetail.sessions.length}</strong></span>
                                    </div>

                                    {expandedDetail.sessions.map((session) => (
                                      <div key={session.sessionId} className="rounded-lg border border-border/50 p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium text-foreground">세션 {session.sessionNumber}</span>
                                          <Badge variant="secondary" className="text-xs">{session.status}</Badge>
                                        </div>
                                        {session.questionAnswers.length > 0 && (
                                          <div className="space-y-2">
                                            {session.questionAnswers.slice(0, 3).map((qa) => (
                                              <div key={qa.questionId} className="flex items-start gap-2 text-xs">
                                                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                                                <div className="min-w-0">
                                                  <p className="text-muted-foreground truncate">{qa.questionText}</p>
                                                  {qa.answerText && (
                                                    <p className="text-foreground/70 truncate mt-0.5">{qa.answerText}</p>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                            {session.questionAnswers.length > 3 && (
                                              <p className="text-xs text-muted-foreground">외 {session.questionAnswers.length - 3}개 질문</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">상세 정보를 불러올 수 없습니다</p>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
