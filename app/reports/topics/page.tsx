"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TopNav } from "@/components/dashboard/top-nav"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { getCsTopicAnalysis } from "@/lib/api/reports"
import { getUserProfile } from "@/lib/api/user"
import { CS_TOPIC_LABELS, CS_TOPIC_ICONS } from "@/lib/cs-topics"
import { cn } from "@/lib/utils"
import type { CsTopicStat } from "@/types/report"

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-rose-500"
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-rose-500"
}

export default function CsTopicAnalysisPage() {
  const [userName, setUserName] = useState("")
  const [topics, setTopics] = useState<CsTopicStat[]>([])
  const [weakTopics, setWeakTopics] = useState<CsTopicStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      getUserProfile()
        .then((u) => setUserName(u.name))
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    getCsTopicAnalysis()
      .then((res) => {
        setTopics(res.topics)
        setWeakTopics(res.weakTopics)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <TopNav userName={userName} />

      <main className="mx-auto w-full max-w-[1040px] px-6 py-9">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">토픽 분석</h1>
          <p className="mt-1 text-sm text-slate-500">
            1:1 기술면접에서의 CS 토픽별 정답률을 분석하고 약점 토픽을 추천해드립니다
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Sparkles className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-900">아직 분석할 데이터가 없습니다</p>
            <p className="mt-1 text-sm text-slate-400">
              1:1 기술면접을 진행하면 CS 토픽별 분석 결과를 확인할 수 있습니다
            </p>
            <Link href="/dashboard">
              <Button className="mt-4 gap-2 bg-blue-600 text-white hover:bg-blue-700">면접 시작하기</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 약점 토픽 */}
            {weakTopics.length > 0 && (
              <section>
                <h2 className="mb-3 text-base font-bold text-slate-900">집중 학습이 필요한 토픽</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {weakTopics.map((t) => {
                    const Icon = CS_TOPIC_ICONS[t.topic]
                    return (
                      <div key={t.topic} className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-500">
                            <Icon size={16} />
                          </span>
                          <span className="font-bold text-slate-900">{CS_TOPIC_LABELS[t.topic]}</span>
                          <span className={cn("ml-auto text-sm font-extrabold", scoreColor(t.averagePercentage))}>
                            {t.averagePercentage.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-500">{t.recommendation}</p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 전체 토픽 통계 */}
            <section>
              <h2 className="mb-3 text-base font-bold text-slate-900">토픽별 정답률</h2>
              <div className="space-y-2">
                {topics.map((t) => {
                  const Icon = CS_TOPIC_ICONS[t.topic]
                  return (
                    <div
                      key={t.topic}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">{CS_TOPIC_LABELS[t.topic]}</span>
                          <span className="text-xs text-slate-400">{t.questionCount}문항</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn("h-full rounded-full", scoreBarColor(t.averagePercentage))}
                            style={{ width: `${Math.min(100, Math.max(0, t.averagePercentage))}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={cn(
                          "w-12 shrink-0 text-right text-sm font-extrabold",
                          scoreColor(t.averagePercentage)
                        )}
                      >
                        {t.averagePercentage.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
