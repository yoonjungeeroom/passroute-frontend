"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Search, X, Loader2 } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBrain, faLightbulb } from "@fortawesome/free-solid-svg-icons"
import { cn } from "@/lib/utils"
import { getReportList, getInterviewReport, getDebateReport, type ReportListItem } from "@/lib/api/reports"
import { DebateReportView } from "@/components/reports/DebateReportView"
import { InterviewReportView } from "@/components/reports/InterviewReportView"
import { getWorstClip } from "@/lib/api/interview"
import type { InterviewReportResponse, DebateReportResponse } from "@/types/report"

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const safeScore = typeof score === "number" && !isNaN(score) ? score : 0
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safeScore / 100) * circumference
  const color = safeScore >= 80 ? "#6B9E7E" : safeScore >= 60 ? "#C4A24E" : "#C45C5C"
  const displayScore = Number.isInteger(safeScore) ? safeScore : safeScore.toFixed(1)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={3}
          className="text-border/30"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold leading-none" style={{ color, fontSize: size * 0.28 }}>{displayScore}</span>
      </div>
    </div>
  )
}



export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedReport, setExpandedReport] = useState<InterviewReportResponse | null>(null)
  const [expandedDebateReport, setExpandedDebateReport] = useState<DebateReportResponse | null>(null)
  const [expandedLoading, setExpandedLoading] = useState(false)
  const [worstClip, setWorstClip] = useState<{ videoUrl: string; clipReason: string | null } | null>(null)
  const [selectedType, setSelectedType] = useState<"all" | "technical" | "personality" | "debate">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(0)

  useEffect(() => {
    async function fetchReports() {
      setLoading(true)
      try {
        const data = await getReportList({
          type: selectedType,
          page,
          size: 10,
          q: searchQuery || undefined,
        })
        setReports(data.items)
      } catch {
        setReports([])
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [selectedType, page, searchQuery])

  const handleExpand = async (report: ReportListItem) => {
    if (expandedId === report.domainId) {
      setExpandedId(null)
      setExpandedReport(null)
      setExpandedDebateReport(null)
      setWorstClip(null)
      return
    }
    setExpandedId(report.domainId)
    setExpandedLoading(true)
    setExpandedReport(null)
    setExpandedDebateReport(null)
    setWorstClip(null)
    try {
      if (report.reportType === "debate") {
        const debateReport = await getDebateReport(report.domainId)
        setExpandedDebateReport(debateReport)
      } else {
        const [interviewReport, clip] = await Promise.all([
          getInterviewReport(report.domainId),
          getWorstClip(report.domainId).catch(() => null),
        ])
        setExpandedReport(interviewReport)
        setWorstClip(clip)
      }
    } catch {
      setExpandedReport(null)
      setExpandedDebateReport(null)
    } finally {
      setExpandedLoading(false)
    }
  }

  const getBadges = (report: ReportListItem): { label: string; style: string }[] => {
    if (report.reportType === "debate") {
      return [{ label: "토론", style: "border-accent/30 bg-accent/10 text-accent" }]
    }
    const badges = [{ label: "1:1", style: "border-primary/30 bg-primary/10 text-primary" }]
    const interviewType = report.interviewType?.toLowerCase()
    if (interviewType === "technical") {
      badges.push({ label: "기술", style: "border-sky-500/30 bg-sky-500/10 text-sky-600" })
    } else if (interviewType === "personality") {
      badges.push({ label: "인성", style: "border-violet-500/30 bg-violet-500/10 text-violet-600" })
    }
    return badges
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
    return `${d.getMonth() + 1}.${d.getDate()} (${dayNames[d.getDay()]})`
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />
      <main className="pt-14 lg:pl-64 lg:pt-0">
        <div className="sticky top-14 z-30 border-b border-border/30 bg-background/95 backdrop-blur-sm lg:top-0">
          <div className="px-4 pt-8 pb-5 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">분석 리포트</h1>
            <p className="text-sm text-muted-foreground mt-1">AI가 분석한 면접 성과와 개선점을 확인하세요</p>
          </div>
        </div>
        <div className="space-y-8 px-4 py-4 sm:px-6 lg:px-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "총 면접", value: reports.length },
              { label: "평균 점수", value: reports.length > 0 ? (reports.reduce((s, r) => s + r.totalScore, 0) / reports.length).toFixed(1) : "--" },
              { label: "최고 점수", value: reports.length > 0 ? Math.max(...reports.map(r => r.totalScore)).toFixed(1) : "--" },
              { label: "분석 완료", value: reports.filter(r => r.totalScore > 0).length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-white p-4 card-hover">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-xl border border-border bg-white p-1 h-11 items-center">
              {(["all", "technical", "personality", "debate"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => { setSelectedType(type); setPage(0) }}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                    selectedType === type
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type === "all" ? "전체" : type === "technical" ? "기술" : type === "personality" ? "인성" : "토론"}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="회사, 직무 검색..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
                className="w-full h-11 rounded-xl border border-border bg-white pl-10 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Report Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
                <FontAwesomeIcon icon={faLightbulb} className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground">아직 리포트가 없습니다</p>
              <p className="mt-1 text-sm text-muted-foreground">면접 연습을 시작하면 AI가 상세 분석 리포트를 생성합니다</p>
              <Link href="/dashboard">
                <Button className="mt-4 gap-2 bg-primary text-white">면접 시작하기</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.domainId}
                  className={cn(
                    "group overflow-hidden rounded-xl border transition-all duration-300",
                    expandedId === report.domainId
                      ? "border-primary/30 bg-white shadow-lg shadow-primary/5"
                      : "border-border bg-white hover:border-primary/20 hover:shadow-sm"
                  )}
                >
                  {/* Card Header */}
                  <button
                    onClick={() => handleExpand(report)}
                    className="flex w-full items-center gap-4 p-4 text-left"
                  >
                    {/* Company Initial */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold text-muted-foreground shrink-0">
                      {(report.companyName || report.jobPosition || "토론").slice(0, 1)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{report.companyName || report.jobPosition || "토론"}</span>
                        {getBadges(report).map((b) => (
                          <Badge key={b.label} variant="outline" className={cn("text-[10px] font-medium", b.style)}>
                            {b.label}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {report.reportType !== "debate" && (
                          <>
                            <span>{report.jobPosition}</span>
                            <span className="h-1 w-1 rounded-full bg-border" />
                          </>
                        )}
                        <span>{formatDate(report.date)}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <ScoreRing score={report.totalScore} size={52} />

                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-300 shrink-0",
                      expandedId === report.domainId && "rotate-180"
                    )} />
                  </button>

                  {/* Expanded Detail */}
                  {expandedId === report.domainId && (
                    <div className="border-t border-border p-5">
                      {expandedLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">분석 리포트 불러오는 중...</span>
                        </div>
                      ) : expandedReport === null && expandedDebateReport === null ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                              <FontAwesomeIcon icon={faBrain} className="h-5 w-5 text-amber-500" />
                            </div>
                            <p className="text-sm font-medium text-foreground">리포트 생성 중</p>
                            <p className="text-xs text-muted-foreground">AI가 분석을 진행하고 있습니다. 잠시 후 다시 확인해주세요.</p>
                          </div>
                        </div>
                      ) : expandedDebateReport ? (
                        <DebateReportView
                          report={expandedDebateReport}
                          compact
                          onReplay={() => router.push("/dashboard")}
                          onDetail={() => router.push(`/reports/debate/${report.domainId}`)}
                        />
                      ) : expandedReport ? (
                        <InterviewReportView
                          report={expandedReport}
                          worstClipUrl={worstClip?.videoUrl}
                          worstClipReason={worstClip?.clipReason}
                          onReplay={report.selfIntroId != null ? () => router.push(`/dashboard?startInterview=${report.selfIntroId}`) : undefined}
                          onDetail={() => router.push(`/reports/interview/${report.domainId}`)}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
