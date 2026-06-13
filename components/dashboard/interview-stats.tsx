"use client"

import { useState } from "react"
import { TrendingUp, Target, Zap, Trophy, Flame } from "lucide-react"

/* 나의 면접 현황 — 점수 추이 + 통계
 * 데모용 정적 데이터입니다. 실제 통계 API가 생기면 sets/스탯 값만 바꿔 연결하세요. */

const BLUE = "#2563eb"

function AreaLine({ data, w = 968, h = 188, pad = 10 }: { data: number[]; w?: number; h?: number; pad?: number }) {
  const max = Math.max(...data) * 1.12
  const min = Math.min(...data) * 0.9
  const X = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2)
  const Y = (v: number) => pad + (1 - (v - min) / (max - min)) * (h - pad * 2)
  const pts = data.map((v, i) => [X(i), Y(v)] as const)
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ")
  const area = line + ` L${X(data.length - 1).toFixed(1)} ${h - pad} L${pad} ${h - pad} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: "auto", display: "block" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="ag-stat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.18" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad} y1={pad + g * (h - pad * 2)} x2={w - pad} y2={pad + g * (h - pad * 2)} stroke="#eef2f6" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#ag-stat)" />
      <path d={line} fill="none" stroke={BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 5 : 3} fill={i === pts.length - 1 ? BLUE : "#fff"} stroke={BLUE} strokeWidth="2.5" />
      ))}
    </svg>
  )
}

function Spark({ data, w = 64, h = 26 }: { data: number[]; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data)
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

function ScoreTrend() {
  const sets: Record<string, number[]> = {
    "주": [70, 74, 71, 79, 77, 80, 82],
    "월": [62, 66, 69, 72, 76, 80, 82],
    "전체": [55, 60, 64, 68, 73, 78, 82],
  }
  const [tab, setTab] = useState("주")
  const data = sets[tab]
  const last = data[data.length - 1]
  const delta = last - data[0]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-400">최근 {data.length}회 면접 점수</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-[36px] font-extrabold leading-none tracking-tight text-slate-900">{last}</span>
            <span className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
              <TrendingUp size={12} strokeWidth={2.6} /> +{delta}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[13px] font-bold">
          {Object.keys(sets).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={"whitespace-nowrap rounded-md px-3 py-1 transition-colors " + (tab === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>{k}</button>
          ))}
        </div>
      </div>
      <div className="mt-5"><AreaLine data={data} /></div>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-400">
        <Target size={13} /> 전체 면접 점수 추이예요. 회사 구분 없이 모든 연습·실전 면접이 반영됩니다.
      </p>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, unit, accent, spark }: { icon: any; label: string; value: string; unit: string; accent?: boolean; spark?: number[] }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className={"grid h-9 w-9 place-items-center rounded-lg " + (accent ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400")}><Icon size={18} strokeWidth={2.2} /></span>
        {spark && <Spark data={spark} />}
      </div>
      <div className="mt-4">
        <p className="text-[13px] font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 text-[26px] font-extrabold tracking-tight text-slate-900">{value}<span className="ml-0.5 text-sm font-bold text-slate-400">{unit}</span></p>
      </div>
    </div>
  )
}

export function InterviewStats() {
  return (
    <section>
      <h3 className="mb-4 text-[22px] font-extrabold tracking-tight text-slate-900">나의 면접 현황</h3>
      <ScoreTrend />
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Zap} label="이번 주 연습" value="3" unit="회" accent spark={[1, 2, 1, 3, 2, 3, 3]} />
        <StatCard icon={Trophy} label="총 면접" value="24" unit="회" />
        <StatCard icon={Target} label="평균 점수" value="82" unit="점" spark={[68, 72, 70, 78, 80, 82]} />
        <StatCard icon={Flame} label="연속 연습" value="5" unit="일" />
      </div>
    </section>
  )
}
