"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronDown, Search, X, RotateCcw, BarChart2, Loader2 } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBrain, faChartLine, faStar, faArrowTrendUp, faLightbulb } from "@fortawesome/free-solid-svg-icons"
import { cn } from "@/lib/utils"
import { getReportList, getInterviewReport, getDebateReport, type ReportListItem } from "@/lib/api/reports"
import { getWorstClip } from "@/lib/api/interview"
import type { InterviewReportResponse, DebateReportResponse } from "@/types/report"

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? "#6B9E7E" : score >= 60 ? "#C4A24E" : "#C45C5C"
  const displayScore = Number.isInteger(score) ? score : score.toFixed(1)

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

function SkillBar({ label, value, max = 5, delay = 0 }: { label: string; value: number; max?: number; delay?: number }) {
  const pct = (value / max) * 100
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400"
  return (
    <div className="group">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
        <span className="text-xs font-bold text-foreground">{value}<span className="text-muted-foreground font-normal">/{max}</span></span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/50">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedReport, setExpandedReport] = useState<InterviewReportResponse | null>(null)
  const [expandedDebateReport, setExpandedDebateReport] = useState<DebateReportResponse | null>(null)
  const [expandedLoading, setExpandedLoading] = useState(false)
  const [worstClipUrl, setWorstClipUrl] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<"all" | "interview" | "debate">("all")
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
      setWorstClipUrl(null)
      return
    }
    setExpandedId(report.domainId)
    setExpandedLoading(true)
    setExpandedReport(null)
    setExpandedDebateReport(null)
    setWorstClipUrl(null)
    try {
      if (report.reportType === "debate") {
        const debateReport = await getDebateReport(report.domainId)
        setExpandedDebateReport(debateReport)
      } else {
        const [interviewReport, clipUrl] = await Promise.all([
          getInterviewReport(report.domainId),
          getWorstClip(report.domainId).catch(() => null),
        ])
        setExpandedReport(interviewReport)
        setWorstClipUrl(clipUrl)
      }
    } catch {
      setExpandedReport(null)
      setExpandedDebateReport(null)
    } finally {
      setExpandedLoading(false)
    }
  }

  const getTypeLabel = (type: string) => type === "interview" ? "1:1 면접" : "토론 면접"
  const getTypeStyle = (type: string) =>
    type === "interview"
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-accent/30 bg-accent/10 text-accent"

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
    return `${d.getMonth() + 1}.${d.getDate()} (${dayNames[d.getDay()]})`
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="w-full overflow-auto lg:ml-64">
        <MobileHeader />
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
              {(["all", "interview", "debate"] as const).map(type => (
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
                  {type === "all" ? "전체" : type === "interview" ? "면접" : "토론"}
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
              {reports.map((report, idx) => (
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
                      {report.companyName.slice(0, 1)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{report.companyName}</span>
                        <Badge variant="outline" className={cn("text-[10px] font-medium", getTypeStyle(report.reportType))}>
                          {getTypeLabel(report.reportType)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{report.jobPosition}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
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
                        <div className="space-y-6">
                          {/* Overall */}
                          <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                            <h4 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
                              <FontAwesomeIcon icon={faLightbulb} className="h-3.5 w-3.5 text-amber-500" />
                              종합 평가
                            </h4>
                            <p className="text-sm leading-relaxed text-muted-foreground">{expandedDebateReport.overall}</p>
                          </div>

                          {/* Turn Feedback */}
                          {expandedDebateReport.turnFeedback.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <FontAwesomeIcon icon={faChartLine} className="h-3.5 w-3.5 text-primary" />
                                라운드별 피드백
                              </h4>
                              {expandedDebateReport.turnFeedback.map((tf, i) => (
                                <div key={i} className="rounded-lg border border-border/50 p-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <Badge variant="outline" className="text-xs">{tf.roundType}</Badge>
                                    <span className="text-xs font-bold text-foreground">{tf.weightedScore}점</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{tf.feedback}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Strategy Analysis */}
                          {expandedDebateReport.strategyAnalysis && (
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                              <h4 className="mb-2 text-sm font-semibold text-blue-600 flex items-center gap-2">
                                <FontAwesomeIcon icon={faBrain} className="h-3.5 w-3.5" />
                                전략 분석
                              </h4>
                              <p className="text-sm text-muted-foreground">{expandedDebateReport.strategyAnalysis}</p>
                            </div>
                          )}

                          {/* Strengths & Improvements */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                              <h4 className="mb-2 text-sm font-semibold text-emerald-600 flex items-center gap-2">
                                <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5" />
                                강점
                              </h4>
                              <p className="text-sm text-muted-foreground">{expandedDebateReport.strengths}</p>
                            </div>
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                              <h4 className="mb-2 text-sm font-semibold text-amber-600 flex items-center gap-2">
                                <FontAwesomeIcon icon={faArrowTrendUp} className="h-3.5 w-3.5" />
                                개선점
                              </h4>
                              <p className="text-sm text-muted-foreground">{expandedDebateReport.improvements}</p>
                            </div>
                          </div>

                          {/* Final Advice */}
                          {expandedDebateReport.finalAdvice && (
                            <div className="rounded-xl bg-muted/30 p-4">
                              <p className="text-sm text-muted-foreground">{expandedDebateReport.finalAdvice}</p>
                            </div>
                          )}
                        </div>
                      ) : expandedReport ? (
                        <div className="space-y-6">
                          {/* Overall & Scores */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                              <h4 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
                                <FontAwesomeIcon icon={faLightbulb} className="h-3.5 w-3.5 text-amber-500" />
                                종합 평가
                              </h4>
                              <p className="text-sm leading-relaxed text-muted-foreground">{expandedReport.overall}</p>
                            </div>
                            <div className="space-y-3">
                              {expandedReport.itemAverages && Object.entries(expandedReport.itemAverages).map(([key, val], i) => (
                                <SkillBar key={key} label={key} value={val as number} delay={i * 100} />
                              ))}
                            </div>
                          </div>

                          {/* Strengths & Improvements */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                              <h4 className="mb-2 text-sm font-semibold text-emerald-600 flex items-center gap-2">
                                <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5" />
                                강점
                              </h4>
                              <p className="text-sm text-muted-foreground">{expandedReport.strengths}</p>
                            </div>
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                              <h4 className="mb-2 text-sm font-semibold text-amber-600 flex items-center gap-2">
                                <FontAwesomeIcon icon={faArrowTrendUp} className="h-3.5 w-3.5" />
                                개선점
                              </h4>
                              <p className="text-sm text-muted-foreground">{expandedReport.improvements}</p>
                            </div>
                          </div>

                          {/* Worst Clip */}
                          {worstClipUrl && (
                            <div className="rounded-xl border border-border/50 p-4">
                              <h4 className="mb-2 text-sm font-semibold text-foreground">개선 필요 구간</h4>
                              <video
                                src={worstClipUrl}
                                controls
                                className="w-full rounded-lg"
                              />
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="text-xs gap-1.5">
                              <RotateCcw className="h-3 w-3" />
                              재연습
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs gap-1.5">
                              <BarChart2 className="h-3 w-3" />
                              상세 분석
                            </Button>
                          </div>
                        </div>
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
