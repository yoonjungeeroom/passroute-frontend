"use client"

import { useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Button } from "@/components/ui/button"
import { Settings, Download } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const [targetRole, setTargetRole] = useState("백엔드 개발자")
  const [level, setLevel] = useState("신입 (0~1년)")
  const [questionCount, setQuestionCount] = useState("10개")
  const [followUp, setFollowUp] = useState(true)
  const [timeLimit, setTimeLimit] = useState(true)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("2분")
  const [language, setLanguage] = useState("한국어")
  const [autoReport, setAutoReport] = useState(true)
  const [dDayAlert, setDDayAlert] = useState(true)
  const [d3Alert, setD3Alert] = useState(true)
  const [d1Alert, setD1Alert] = useState(true)
  const [updateAlert, setUpdateAlert] = useState(false)
  const [dataSharing, setDataSharing] = useState(true)

  // DB 저장 함수
  const saveToDatabase = async (key: string, value: any) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })
      if (!response.ok) console.error("Failed to save settings")
    } catch (error) {
      console.error("Error saving to database:", error)
    }
  }

  const handleTargetRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetRole(e.target.value)
    saveToDatabase("targetRole", e.target.value)
  }

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLevel(e.target.value)
    saveToDatabase("level", e.target.value)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="w-full overflow-auto lg:ml-64">
        <MobileHeader />
        <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">설정</h1>
            </div>
            <p className="text-muted-foreground">면접 설정·알림·플랜을 관리하세요</p>
          </div>

          {/* Profile Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">프로필</h2>
            <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-semibold">
                  김지
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">김지민</p>
                  <p className="text-sm text-muted-foreground">jimin.kim@email.com</p>
                </div>
              </div>

              {/* Target Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">목표 직군</label>
                <p className="text-xs text-muted-foreground">면접 질문 난이도와 타입에 직접 영향을 줍니다</p>
                <select
                  value={targetRole}
                  onChange={handleTargetRoleChange}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground appearance-none cursor-pointer hover:border-primary/30 focus:border-primary focus:outline-none"
                >
                  <option>백엔드 개발자</option>
                  <option>프론트엔드 개발자</option>
                  <option>풀스택 개발자</option>
                  <option>AI 엔지니어</option>
                </select>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">경력</label>
                <p className="text-xs text-muted-foreground">질문 난이도와 깊이 조정에 사용됩니다</p>
                <select
                  value={level}
                  onChange={handleLevelChange}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground appearance-none cursor-pointer hover:border-primary/30 focus:border-primary focus:outline-none"
                >
                  <option>신입 (0~1년)</option>
                  <option>주니어 (1~3년)</option>
                  <option>시니어 (3년 이상)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Interview Settings */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">면접 설정</h2>
            <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
              {/* Question Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">질문 수</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground appearance-none cursor-pointer hover:border-primary/30 focus:border-primary focus:outline-none"
                >
                  <option>5개</option>
                  <option>10개</option>
                  <option>15개</option>
                </select>
              </div>

              {/* Follow-up Questions */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">꼬리 질문</p>
                  <p className="text-xs text-muted-foreground">답변에 따라 AI가 추가 질문을 생성합니다</p>
                </div>
                <button
                  onClick={() => setFollowUp(!followUp)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    followUp ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      followUp ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {/* Time Limit */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">시간 제한</p>
                  <p className="text-xs text-muted-foreground">실전처럼 답변 시간을 제한합니다</p>
                </div>
                <div className="flex items-center gap-2">
                  {timeLimit && (
                    <select
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(e.target.value)}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground appearance-none cursor-pointer hover:border-primary/30 focus:border-primary focus:outline-none"
                    >
                      <option>1분</option>
                      <option>2분</option>
                      <option>3분</option>
                    </select>
                  )}
                  <button
                    onClick={() => setTimeLimit(!timeLimit)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      timeLimit ? "bg-primary" : "bg-border"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                        timeLimit ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Feedback Language */}
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-foreground">피드백 언어</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground appearance-none cursor-pointer hover:border-primary/30 focus:border-primary focus:outline-none"
                >
                  <option>한국어</option>
                  <option>English</option>
                  <option>日本語</option>
                </select>
              </div>

              {/* Auto Report */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">자동 리포트 생성</p>
                  <p className="text-xs text-muted-foreground">면접 종료 후 자동으로 리포트를 생성합니다</p>
                </div>
                <button
                  onClick={() => setAutoReport(!autoReport)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    autoReport ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      autoReport ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">알림</h2>
            <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
              <p className="text-xs text-muted-foreground mb-4">D-day 알림이 이 서비스에서 가장 중요한 알림입니다</p>

              {/* D-day Alert */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">D-day 알림</p>
                  <p className="text-xs text-muted-foreground">면접 당일 알림</p>
                </div>
                <button
                  onClick={() => setDDayAlert(!dDayAlert)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    dDayAlert ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      dDayAlert ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {/* D-3 Alert */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">D-3 알림</p>
                  <p className="text-xs text-muted-foreground">면접 3일 전 알림</p>
                </div>
                <button
                  onClick={() => setD3Alert(!d3Alert)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    d3Alert ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      d3Alert ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {/* D-1 Alert */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">D-1 알림</p>
                  <p className="text-xs text-muted-foreground">면접 1일 전 알림</p>
                </div>
                <button
                  onClick={() => setD1Alert(!d1Alert)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    d1Alert ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      d1Alert ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {/* Update Alert */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">서비스 업데이트</p>
                  <p className="text-xs text-muted-foreground">업데이트 및 팁 이메일</p>
                </div>
                <button
                  onClick={() => setUpdateAlert(!updateAlert)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    updateAlert ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      updateAlert ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Plan */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">플랜</h2>
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                      Pro
                    </span>
                  </div>
                  <p className="text-sm text-foreground">이번 달 면접 시험: <span className="font-semibold">7회 / 10회</span></p>
                  <p className="text-xs text-muted-foreground mt-1">2026년 6월 1일 리셋</p>
                </div>
                <button className="text-sm font-medium text-primary hover:text-primary/80">
                  업그레이드
                </button>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-border overflow-hidden">
                <div className="h-full w-[70%] bg-primary rounded-full" />
              </div>
            </div>
          </section>

          {/* Data & Account */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">데이터 & 계정</h2>
            <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
              {/* Data Sharing */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">데이터 공유</p>
                  <p className="text-xs text-muted-foreground">익명화된 데이터를 공유하고 서비스 개선에 참여</p>
                </div>
                <button
                  onClick={() => setDataSharing(!dataSharing)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    dataSharing ? "bg-primary" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                      dataSharing ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              <div className="border-t border-border pt-3">
                {/* Export Data */}
                <div className="flex items-center justify-between py-3">
                  <p className="text-sm text-foreground">면접 기록 내보내기</p>
                  <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
                    <Download className="h-4 w-4" />
                    내보내기
                  </button>
                </div>

                {/* Export PDF */}
                <div className="flex items-center justify-between py-3">
                  <p className="text-sm text-foreground">리포트 PDF 내보내기</p>
                  <button className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
                    <Download className="h-4 w-4" />
                    내보내기
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="mb-12">
            <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
              <h2 className="text-sm font-semibold text-red-900">위험 영역</h2>

              {/* Withdraw */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-medium text-red-900">계정 탈퇴</p>
                  <p className="text-xs text-red-700">모든 데이터가 영구 삭제됩니다</p>
                </div>
                <button className="text-sm font-medium text-red-600 hover:text-red-700">
                  탈퇴하기
                </button>
              </div>
            </div>
          </section>

          {/* Spacer */}
          <div className="h-8" />
        </div>
      </main>
    </div>
  )
}
