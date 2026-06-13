"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { TopNav } from "@/components/dashboard/top-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Search, X, Loader2, Trash2 } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBrain, faLightbulb } from "@fortawesome/free-solid-svg-icons"
import { cn } from "@/lib/utils"
import {
  getReportList,
  getInterviewReport,
  getDebateReport,
  deleteInterviewReport,
  deleteDebateReport,
  type ReportListItem,
} from "@/lib/api/reports"
import { DebateReportView } from "@/components/reports/DebateReportView"
import { InterviewReportView } from "@/components/reports/InterviewReportView"
import { getWorstClip } from "@/lib/api/interview"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { getUserProfile } from "@/lib/api/user"
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
          fill="none" stroke="#e2e8f0" strokeWidth={3}
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
        <span className="font-bold leading-none" style={{ color, fontSize: size * 0.28 }}>
          {displayScore}
        </span>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
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
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // stats 전용 — 필터/페이지 무관하게 전체 데이터 기반으로 계산
  const [allReports, setAllReports] = useState<ReportListItem[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  // 사용자 이름 fetch
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      getUserProfile()
        .then((u) => setUserName(u.name))
        .catch(() => {})
    }
  }, [])

  // 전체 리포트 한 번만 fetch (stats 계산용)
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (!token) { setStatsLoading(false); return }
    getReportList({ page: 0, size: 1000 })
      .then((res) => setAllReports(res.items))
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [])

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

  async function handleDelete(report: ReportListItem) {
    setDeleteError(null)
    const prev = reports
    setReports((list) =>
      list.filter((r) => !(r.domainId === report.domainId && r.reportType === report.reportType))
    )
    if (expandedId === report.domainId) {
      setExpandedId(null)
      setExpandedReport(null)
      setExpandedDebateReport(null)
      setWorstClip(null)
    }
    try {
      if (report.reportType === "debate") {
        await deleteDebateReport(report.domainId)
      } else {
        await deleteInterviewReport(report.domainId)
      }
      // allReports에서도 제거
      setAllReports((list) =>
        list.filter((r) => !(r.domainId === report.domainId && r.reportType === report.reportType))
      )
    } catch {
      setReports(prev)
      setDeleteError("리포트 삭제에 실패했어요. 잠시 후 다시 시도해주세요.")
    }
  }

  const getBadges = (report: ReportListItem): { label: string; style: string }[] => {
    if (report.reportType === "debate") {
      return [{ label: "토론", style: "border-violet-300 bg-violet-50 text-violet-600" }]
    }
    const badges = [{ label: "1:1", style: "border-blue-300 bg-blue-50 text-blue-600" }]
    const interviewType = report.interviewType?.toLowerCase()
    if (interviewType === "technical") {
      badges.push({ label: "기술", style: "border-sky-300 bg-sky-50 text-sky-600" })
    } else if (interviewType === "personality") {
      badges.push({ label: "인성", style: "border-violet-300 bg-violet-50 text-violet-600" })
    }
    return badges
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
    return `${d.getMonth() + 1}.${d.getDate()} (${dayNames[d.getDay()]})`
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <TopNav userName={userName} />

      <main className="mx-auto w-full max-w-[1040px] px-6 py-9">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">분석 리포트</h1>
          <p className="mt-1 text-sm text-slate-500">AI가 분석한 면접 성과와 개선점을 확인하세요</p>
        </div>

        {/* Quick Stats — allReports 기반 (전체, 필터 무관) */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "총 면접",
              value: statsLoading ? "—" : allReports.length,
            },
            {
              label: "평균 점수",
              value: statsLoading
                ? "—"
                : allReports.filter((r) => r.totalScore > 0).length > 0
                ? (
                    allReports
                      .filter((r) => r.totalScore > 0)
                      .reduce((s, r) => s + r.totalScore, 0) /
                    allReports.filter((r) => r.totalScore > 0).length
                  ).toFixed(1)
                : "--",
            },
            {
              label: "최고 점수",
              value: statsLoading
                ? "—"
                : allReports.filter((r) => r.totalScore > 0).length > 0
                ? Math.max(...allReports.map((r) => r.totalScore)).toFixed(1)
                : "--",
            },
            {
              label: "분석 완료",
              value: statsLoading ? "—" : allReports.filter((r) => r.totalScore > 0).length,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
              <div className="mt-1 text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {(["all", "technical", "personality", "debate"] as const).map((type) => (
              <button
                key={type}
                onClick={() => { setSelectedType(type); setPage(0) }}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                  selectedType === type
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-700"
                )}
              >
                {type === "all" ? "전체" : type === "technical" ? "기술" : type === "personality" ? "인성" : "토론"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="회사, 직무 검색..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Delete Error */}
        {deleteError && (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-500">
            {deleteError}
          </p>
        )}

        {/* Report Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <FontAwesomeIcon icon={faLightbulb} className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-900">아직 리포트가 없습니다</p>
            <p className="mt-1 text-sm text-slate-400">
              면접 연습을 시작하면 AI가 상세 분석 리포트를 생성합니다
            </p>
            <Link href="/dashboard">
              <Button className="mt-4 gap-2 bg-blue-600 text-white hover:bg-blue-700">
                면접 시작하기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={`${report.reportType}-${report.domainId}`}
                className={cn(
                  "overflow-hidden rounded-2xl border transition-all duration-300",
                  expandedId === report.domainId
                    ? "border-blue-200 bg-white shadow-md"
                    : "border-slate-200 bg-white hover:border-blue-100 hover:shadow-sm"
                )}
              >
                <div className="flex items-center">
                  <button
                    onClick={() => handleExpand(report)}
                    className="flex min-w-0 flex-1 items-center gap-4 p-4 text-left"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 shrink-0">
                      {(report.companyName || report.jobPosition || "토론").slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">
                          {report.companyName || report.jobPosition || "토론"}
                        </span>
                        {getBadges(report).map((b) => (
                          <Badge key={b.label} variant="outline" className={cn("text-[10px] font-medium", b.style)}>
                            {b.label}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {report.reportType !== "debate" && (
                          <>
                            <span>{report.jobPosition}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                          </>
                        )}
                        <span>{formatDate(report.date)}</span>
                      </div>
                    </div>
                    <ScoreRing score={report.totalScore} size={52} />
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-400 transition-transform duration-300 shrink-0",
                        expandedId === report.domainId && "rotate-180"
                      )}
                    />
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        aria-label="리포트 삭제"
                        className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>이 리포트를 삭제할까요?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {(report.companyName || report.jobPosition || "토론")} · {formatDate(report.date)}{" "}
                          기록과 분석 리포트가 삭제됩니다. 삭제하면 집계에서도 제외되며 되돌릴 수 없어요.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(report)}
                          className="bg-rose-500 text-white hover:bg-rose-600"
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Expanded Detail */}
                {expandedId === report.domainId && (
                  <div className="border-t border-slate-100 p-5">
                    {expandedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-slate-400">분석 리포트 불러오는 중...</span>
                      </div>
                    ) : expandedReport === null && expandedDebateReport === null ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                            <FontAwesomeIcon icon={faBrain} className="h-5 w-5 text-amber-500" />
                          </div>
                          <p className="text-sm font-medium text-slate-900">리포트 생성 중</p>
                          <p className="text-xs text-slate-400">
                            AI가 분석을 진행하고 있습니다. 잠시 후 다시 확인해주세요.
                          </p>
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
                        onReplay={
                          report.selfIntroId != null
                            ? () => router.push(`/dashboard?startInterview=${report.selfIntroId}`)
                            : undefined
                        }
                        onDetail={() => router.push(`/reports/interview/${report.domainId}`)}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
