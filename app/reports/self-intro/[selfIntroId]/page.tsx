"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import { TopNav } from "@/components/dashboard/top-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft, ChevronRight, Loader2, Briefcase, Play,
  TrendingUp, TrendingDown, AlertTriangle, FileText, Sparkles, Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getReportList, getSelfIntroReport, type ReportListItem } from "@/lib/api/reports"
import { SkillBar } from "@/components/reports/SkillBar"
import { getUserProfile } from "@/lib/api/user"
import type { SelfIntroReportResponse } from "@/types/report"

const ITEM_LABELS: Record<string, string> = {
  relevance: "관련성",
  logic: "논리성",
  specificity: "구체성",
  conciseness: "간결성",
  clarity: "명확성",
  jobRelevance: "직무 적합성",
  accuracy: "정확성",
  depth: "답변 깊이",
  authenticity: "진정성",
  growth: "성장 가능성",
}

const READINESS: Record<string, { label: string; className: string }> = {
  READY: { label: "합격권 근접", className: "border-emerald-300 bg-emerald-50 text-emerald-600" },
  NEEDS_REVIEW: { label: "추가 연습 필요", className: "border-amber-300 bg-amber-50 text-amber-600" },
  NEEDS_IMPROVEMENT: { label: "기초 보강 필요", className: "border-rose-300 bg-rose-50 text-rose-500" },
}

function scoreColor(score: number) {
  return score >= 80 ? "#6B9E7E" : score >= 60 ? "#C4A24E" : "#C45C5C"
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const safe = typeof score === "number" && !isNaN(score) ? score : 0
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safe / 100) * circumference
  const color = scoreColor(safe)
  const display = Number.isInteger(safe) ? safe : safe.toFixed(1)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={3} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold leading-none" style={{ color, fontSize: size * 0.28 }}>{display}</span>
      </div>
    </div>
  )
}

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null
  const w = 280, h = 64, pad = 8
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1
  const pts = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
    const y = h - pad - ((s - min) / range) * (h - pad * 2)
    return [x, y] as const
  })
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
  const last = pts[pts.length - 1]
  const color = scoreColor(scores[scores.length - 1])
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={3.5} fill={color} />
    </svg>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "--"
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${dayNames[d.getDay()]})`
}

function fmtScore(v: number | null | undefined) {
  if (v == null) return "--"
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

function SelfIntroReportContent() {
  const router = useRouter()
  const params = useParams()
  const selfIntroId = Number(params.selfIntroId)

  const [userName, setUserName] = useState("")
  const [report, setReport] = useState<SelfIntroReportResponse | null>(null)
  const [sessions, setSessions] = useState<ReportListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      getUserProfile().then((u) => setUserName(u.name)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!selfIntroId || isNaN(selfIntroId)) {
      setError(true)
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(false)
      try {
        const [aggregate, list] = await Promise.all([
          getSelfIntroReport(selfIntroId),
          getReportList({ type: "all", resumeId: selfIntroId, size: 100 }).catch(() => null),
        ])
        if (cancelled) return
        setReport(aggregate)
        const items = (list?.items ?? [])
          .filter((r) => r.selfIntroId === selfIntroId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setSessions(items)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selfIntroId])

  const empty = !report || report.totalSessions === 0
  const readiness = report?.readiness ? READINESS[report.readiness.level] : null
  const itemAverageEntries = report?.itemAverages
    ? Object.entries(report.itemAverages).sort((a, b) => a[1] - b[1])
    : []
  const changedTrends = (report?.itemTrend ?? []).filter((t) => t.direction !== "STABLE")

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <TopNav userName={userName} />

      <main className="mx-auto w-full max-w-[1040px] px-6 py-9">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/self-intro")}
            className="shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-base font-extrabold text-slate-500">
              {(report?.companyName ?? "?").slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-[22px] font-extrabold tracking-tight text-slate-900">
                  {report?.companyName ?? "자소서별 리포트"}
                </h1>
                {readiness && (
                  <Badge variant="outline" className={cn("shrink-0 text-[10px] font-medium", readiness.className)}>
                    {readiness.label}
                  </Badge>
                )}
              </div>
              {report?.jobPosition && (
                <p className="flex items-center gap-1 truncate text-sm text-slate-400">
                  <Briefcase className="h-3.5 w-3.5" />
                  {report.jobPosition}
                </p>
              )}
            </div>
          </div>
          {!loading && !error && (
            <Button
              className="ml-auto shrink-0 gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => router.push(`/dashboard?startInterview=${selfIntroId}`)}
            >
              <Play className="h-4 w-4" />
              면접 연습
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
            <AlertTriangle className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-lg font-semibold text-slate-900">리포트를 불러오지 못했어요</p>
            <p className="mt-1 text-sm text-slate-400">잠시 후 다시 시도해주세요</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/self-intro")}>
              목록으로
            </Button>
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-lg font-semibold text-slate-900">아직 연습 리포트가 없어요</p>
            <p className="mt-1 text-sm text-slate-400">
              이 자기소개서로 면접을 연습하면 집계 리포트가 쌓입니다
            </p>
            <Button
              className="mt-4 gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => router.push(`/dashboard?startInterview=${selfIntroId}`)}
            >
              <Play className="h-4 w-4" />
              면접 연습 시작
            </Button>
          </div>
        ) : report ? (
          <div className="space-y-5">
            {/* 요약 통계 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "응시 횟수", value: `${report.totalSessions}회` },
                { label: "평균 점수", value: fmtScore(report.overallAverage) },
                { label: "최고 점수", value: fmtScore(report.bestSession?.score) },
                { label: "최근 점수", value: fmtScore(report.scoreTimeline.at(-1)?.score) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
                  <div className="mt-1 text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* 종합 진단 */}
            {(readiness || report.growthSummary || report.aiSummary) && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">종합 진단</h3>
                  {readiness && (
                    <Badge variant="outline" className={cn("text-[10px] font-medium", readiness.className)}>
                      {readiness.label}
                    </Badge>
                  )}
                </div>
                {report.aiSummary ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm leading-relaxed text-slate-700">{report.aiSummary.overall}</p>
                    <div>
                      <h4 className="mb-1 text-xs font-semibold text-slate-400">반복되는 약점</h4>
                      <p className="text-sm leading-relaxed text-slate-700">{report.aiSummary.repeatedWeakness}</p>
                    </div>
                    <div>
                      <h4 className="mb-1 text-xs font-semibold text-slate-400">다음 연습 방향</h4>
                      <p className="text-sm leading-relaxed text-slate-700">{report.aiSummary.nextSteps}</p>
                    </div>
                  </div>
                ) : (
                  report.growthSummary && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{report.growthSummary}</p>
                  )
                )}
                {report.readiness?.comment && (
                  <p className="mt-1 text-sm text-slate-500">{report.readiness.comment}</p>
                )}
              </div>
            )}

            {/* 점수 추이 + 항목별 변화 */}
            <div className="grid gap-4 lg:grid-cols-2">
              {report.hasTrendData && report.scoreTimeline.length >= 2 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">점수 추이</h3>
                  <Sparkline scores={report.scoreTimeline.map((p) => p.score)} />
                  <p className="mt-2 text-xs text-slate-400">
                    {report.scoreTimeline.length}회차 · 첫 회{" "}
                    {fmtScore(report.scoreTimeline[0].score)}점 → 최근{" "}
                    {fmtScore(report.scoreTimeline.at(-1)?.score)}점
                  </p>
                </div>
              )}
              {changedTrends.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    항목별 변화 (첫 회 → 최근)
                  </h3>
                  <div className="space-y-2">
                    {changedTrends.map((t) => (
                      <div key={t.item} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{ITEM_LABELS[t.item] ?? t.item}</span>
                        <span
                          className={cn(
                            "flex items-center gap-1 font-medium",
                            t.direction === "UP" ? "text-emerald-600" : "text-rose-500"
                          )}
                        >
                          {t.direction === "UP" ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" />
                          )}
                          {t.firstAvg.toFixed(1)} → {t.lastAvg.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 항목별 평균 */}
            {itemAverageEntries.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-1 text-sm font-bold text-slate-900">항목별 평균</h3>
                <p className="mb-4 text-xs text-slate-400">
                  전체 응시 평균 · 점수가 낮은 항목이 상시 약점입니다
                </p>
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {itemAverageEntries.map(([key, value], i) => (
                    <SkillBar key={key} label={ITEM_LABELS[key] ?? key} value={value} delay={i * 50} />
                  ))}
                </div>
              </div>
            )}

            {/* 집중 보완 포인트 */}
            {report.worstSession && report.worstSession.weaknesses.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  집중 보완 포인트
                  <span className="text-xs font-normal text-slate-400">
                    ({report.worstSession.round}회차 · {fmtScore(report.worstSession.score)}점 기준)
                  </span>
                </h3>
                <div className="space-y-2">
                  {report.worstSession.weaknesses.map((w, i) => (
                    <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">{w.item}</p>
                      {w.comment && (
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{w.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 자주 추천된 예상 질문 */}
            {report.topRecommendedQuestions.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Trophy className="h-4 w-4 text-blue-600" />
                  자주 추천된 예상 질문
                </h3>
                <div className="space-y-2">
                  {report.topRecommendedQuestions.slice(0, 6).map((q, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 shrink-0 rounded-full bg-blue-50 px-2 text-xs font-bold text-blue-600">
                        {q.count}회
                      </span>
                      <span className="text-slate-700">{q.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 연습 기록 */}
            {sessions.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-900">
                  연습 기록 {sessions.length}건
                </h3>
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <button
                      key={s.domainId}
                      onClick={() => router.push(`/reports/interview/${s.domainId}`)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-200 hover:shadow-sm"
                    >
                      <ScoreRing score={s.totalScore} size={52} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-medium",
                              s.interviewType?.toLowerCase() === "technical"
                                ? "border-sky-300 bg-sky-50 text-sky-600"
                                : "border-violet-300 bg-violet-50 text-violet-600"
                            )}
                          >
                            {s.interviewType?.toLowerCase() === "technical" ? "기술" : "인성"}
                          </Badge>
                          <span className="text-xs text-slate-400">{formatDate(s.date)}</span>
                        </div>
                        {s.feedbackPreview && (
                          <p className="truncate text-sm text-slate-400">{s.feedbackPreview}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default function SelfIntroReportPage() {
  return (
    <Suspense>
      <SelfIntroReportContent />
    </Suspense>
  )
}
