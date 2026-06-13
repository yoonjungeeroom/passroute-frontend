"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Target, Zap, Trophy, Flame, Loader2 } from "lucide-react"
import { getReportList, type ReportListItem } from "@/lib/api/reports"

const BLUE = "#2563eb"

function AreaLine({ data, w = 968, h = 188, pad = 10 }: { data: number[]; w?: number; h?: number; pad?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data) * 1.12
  const min = Math.min(...data) * 0.9
  const X = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2)
  const Y = (v: number) => pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2)
  const pts = data.map((v, i) => [X(i), Y(v)] as const)
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ")
  const area = line + ` L${X(data.length - 1).toFixed(1)} ${h - pad} L${pad} ${h - pad} Z`
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ height: "auto", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="ag-stat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.18" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={pad} y1={pad + g * (h - pad * 2)}
          x2={w - pad} y2={pad + g * (h - pad * 2)}
          stroke="#eef2f6" strokeWidth="1"
        />
      ))}
      <path d={area} fill="url(#ag-stat)" />
      <path d={line} fill="none" stroke={BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p[0]} cy={p[1]}
          r={i === pts.length - 1 ? 5 : 3}
          fill={i === pts.length - 1 ? BLUE : "#fff"}
          stroke={BLUE} strokeWidth="2.5"
        />
      ))}
    </svg>
  )
}

function Spark({ data, w = 64, h = 26 }: { data: number[]; w?: number; h?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const X = (i: number) => (i / (data.length - 1)) * w
  const Y = (v: number) => h - 3 - ((v - min) / (max - min || 1)) * (h - 6)
  const path = data.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ")
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={path} fill="none" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r="3.5" fill={BLUE} />
    </svg>
  )
}

interface Stats {
  total: number
  avg: number
  thisWeek: number
  streak: number
  trend: number[]       // 최근 최대 7회 점수 (시간순)
  sparkAvg: number[]    // 최근 6회 평균 (sparkline용)
}

function computeStats(items: ReportListItem[]): Stats {
  if (items.length === 0) {
    return { total: 0, avg: 0, thisWeek: 0, streak: 0, trend: [], sparkAvg: [] }
  }

  // 날짜순 정렬 (오래된→최신)
  const sorted = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const total = items.length

  const scored = sorted.filter((r) => r.totalScore > 0)
  const avg = scored.length > 0
    ? Math.round(scored.reduce((s, r) => s + r.totalScore, 0) / scored.length)
    : 0

  // 최근 7개 점수 trend
  const trend = scored.slice(-7).map((r) => r.totalScore)

  // 이번 주 연습 횟수
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(now.getDate() - now.getDay()) // 일요일 기준
  const thisWeek = items.filter((r) => new Date(r.date) >= weekStart).length

  // 연속 연습일 (오늘 포함, 하루라도 빠지면 종료)
  const dateSet = new Set(
    items.map((r) => {
      const d = new Date(r.date)
      d.setHours(0, 0, 0, 0)
      return d.toDateString()
    })
  )
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (dateSet.has(cursor.toDateString())) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  // sparkline: 최근 6개 점수 (StatCard 평균 점수용)
  const sparkAvg = scored.slice(-6).map((r) => r.totalScore)

  return { total, avg, thisWeek, streak, trend, sparkAvg }
}

function ScoreTrend({ trend, loading }: { trend: number[]; loading: boolean }) {
  const last = trend.length > 0 ? trend[trend.length - 1] : 0
  const delta = trend.length > 1 ? last - trend[0] : 0

  if (loading) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    )
  }

  if (trend.length === 0) {
    return (
      <div className="flex h-[180px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center">
        <p className="text-[13px] text-slate-400">아직 면접 기록이 없습니다</p>
        <p className="mt-1 text-[11px] text-slate-300">면접 연습을 시작하면 점수 추이가 표시됩니다</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-400">최근 {trend.length}회 면접 점수</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-[36px] font-extrabold leading-none tracking-tight text-slate-900">
              {last}
            </span>
            {delta !== 0 && (
              <span
                className={
                  "mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold " +
                  (delta >= 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-500")
                }
              >
                <TrendingUp size={12} strokeWidth={2.6} />
                {delta >= 0 ? "+" : ""}{delta}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5">
        <AreaLine data={trend} />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-400">
        <Target size={13} /> 전체 면접 점수 추이예요. 회사 구분 없이 모든 면접이 반영됩니다.
      </p>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  accent,
  spark,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  unit: string
  accent?: boolean
  spark?: number[]
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span
          className={
            "grid h-9 w-9 place-items-center rounded-lg " +
            (accent ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400")
          }
        >
          <Icon size={18} strokeWidth={2.2} />
        </span>
        {spark && spark.length >= 2 && <Spark data={spark} />}
      </div>
      <div className="mt-4">
        <p className="text-[13px] font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 text-[26px] font-extrabold tracking-tight text-slate-900">
          {value}
          <span className="ml-0.5 text-sm font-bold text-slate-400">{unit}</span>
        </p>
      </div>
    </div>
  )
}

export function InterviewStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (!token) {
      setLoading(false)
      return
    }
    getReportList({ page: 0, size: 100 })
      .then((res) => setStats(computeStats(res.items)))
      .catch(() => setStats(computeStats([])))
      .finally(() => setLoading(false))
  }, [])

  const s = stats ?? { total: 0, avg: 0, thisWeek: 0, streak: 0, trend: [], sparkAvg: [] }

  return (
    <section>
      <h3 className="mb-4 text-[22px] font-extrabold tracking-tight text-slate-900">나의 면접 현황</h3>
      <ScoreTrend trend={s.trend} loading={loading} />
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Zap}
          label="이번 주 연습"
          value={loading ? "—" : s.thisWeek}
          unit="회"
          accent
          spark={s.trend.slice(-7)}
        />
        <StatCard
          icon={Trophy}
          label="총 면접"
          value={loading ? "—" : s.total}
          unit="회"
        />
        <StatCard
          icon={Target}
          label="평균 점수"
          value={loading ? "—" : s.avg || "--"}
          unit={s.avg ? "점" : ""}
          spark={s.sparkAvg}
        />
        <StatCard
          icon={Flame}
          label="연속 연습"
          value={loading ? "—" : s.streak}
          unit="일"
        />
      </div>
    </section>
  )
}
