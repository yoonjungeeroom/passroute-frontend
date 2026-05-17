"use client"

import { useState } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronDown, Search, X, Sparkles, RotateCcw, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

type InterviewType = 'tech' | 'human'

interface Report {
  id: string
  company: string
  role: string
  type: InterviewType
  date: string
  dayOfWeek: string
  duration: number
  totalScore: number
  resumeId: string
  feedbackPreview: string
  scores: {
    label: string
    value: number
  }[]
}

interface UpcomingInterview {
  id: string
  company: string
  role: string
  type: InterviewType
  date: string
  dday: number
  resumeId: string
  resumeFilename: string
  previousReports: {
    type: InterviewType
    date: string
    score: number
  }[]
  aiFeedback: string
}

const upcomingInterviews: UpcomingInterview[] = [
  {
    id: "1",
    company: "카카오",
    role: "AI 엔지니어",
    type: "tech",
    date: "2026.05.20 14:00",
    dday: -3,
    resumeId: "kakao-ai",
    resumeFilename: "카카오_AI엔지니어_이력서.pdf",
    previousReports: [
      { type: "tech", date: "2026.03.15", score: 82 },
      { type: "human", date: "2026.03.20", score: 88 },
    ],
    aiFeedback: "지난 면접 대비 기술 이해도 상승. 아키텍처 설계 부분의 깊이를 더 높이면 합격 가능성 증대.",
  },
  {
    id: "2",
    company: "토스",
    role: "iOS 개발자",
    type: "human",
    date: "2026.05.24 10:00",
    dday: -7,
    resumeId: "toss-ios",
    resumeFilename: "토스_iOS개발자_이력서.pdf",
    previousReports: [
      { type: "tech", date: "2026.03.10", score: 75 },
    ],
    aiFeedback: "팀워크와 커뮤니케이션 강점. 개인 프로젝트 경험 스토리텔링을 더 구체적으로 준비하세요.",
  },
  {
    id: "3",
    company: "쿠팡",
    role: "백엔드 개발자",
    type: "tech",
    date: "2026.05.31 15:00",
    dday: -14,
    resumeId: "samsung-sw",
    resumeFilename: "삼성_SW개발자_이력서.pdf",
    previousReports: [],
    aiFeedback: "첫 면접입니다. 백엔드 기초 개념을 충분히 이해하고 있으니 시스템 디자인 부분 집중 연습 추천.",
  },
]

const pastReports: Report[] = [
  {
    id: "r1",
    company: "삼성전자",
    role: "프론트엔드",
    type: "tech",
    date: "2026.03.28",
    dayOfWeek: "금",
    duration: 47,
    totalScore: 87,
    resumeId: "samsung-sw",
    feedbackPreview: "React 렌더링 최적화 우수. CSS 성능 구조체 부분 → repaint/reflow 에서 준비 필요",
    scores: [
      { label: "기술 이해", value: 89 },
      { label: "답변 구조", value: 85 },
      { label: "논리력", value: 87 },
      { label: "자신감", value: 86 },
    ],
  },
  {
    id: "r2",
    company: "카카오",
    role: "백엔드",
    type: "tech",
    date: "2026.03.26",
    dayOfWeek: "수",
    duration: 38,
    totalScore: 92,
    resumeId: "kakao-ai",
    feedbackPreview: "분산 시스템 설계 탁월. 트레이드오프 분석과 실제 구현 경험이 모두 우수.",
    scores: [
      { label: "기술 이해", value: 94 },
      { label: "답변 구조", value: 92 },
      { label: "논리력", value: 90 },
      { label: "자신감", value: 91 },
    ],
  },
  {
    id: "r3",
    company: "네이버",
    role: "풀스택",
    type: "human",
    date: "2026.03.24",
    dayOfWeek: "월",
    duration: 42,
    totalScore: 78,
    resumeId: "naver-backend",
    feedbackPreview: "자기소개·지원동기 매끄러움. 팀 갈등 해결 예시 → 더 구체적이고 주인의식 드러내기",
    scores: [
      { label: "커뮤니케이션", value: 82 },
      { label: "성장 지향", value: 76 },
      { label: "팀워크", value: 75 },
      { label: "자신감", value: 79 },
    ],
  },
  {
    id: "r4",
    company: "삼성전자",
    role: "프론트엔드",
    type: "human",
    date: "2026.03.22",
    dayOfWeek: "토",
    duration: 30,
    totalScore: 85,
    resumeId: "samsung-sw",
    feedbackPreview: "자기소개·지원동기 경험에서 STAR 기법 활용 부족. 구체적 수치/결과 준비하세요.",
    scores: [
      { label: "커뮤니케이션", value: 87 },
      { label: "성장 지향", value: 84 },
      { label: "팀워크", value: 84 },
      { label: "자신감", value: 84 },
    ],
  },
  {
    id: "r5",
    company: "라인",
    role: "백엔드",
    type: "tech",
    date: "2026.03.15",
    dayOfWeek: "일",
    duration: 60,
    totalScore: 71,
    resumeId: "naver-backend",
    feedbackPreview: "기술 깊이의 비즈니스 영향 설명 약함. 임원 수준 맥락 이해 연습 추천.",
    scores: [
      { label: "기술 이해", value: 74 },
      { label: "답변 구조", value: 68 },
      { label: "논리력", value: 70 },
      { label: "자신감", value: 72 },
    ],
  },
]

const resumes = [
  "전체 자소서",
  "네이버_백엔드_이력서.pdf",
  "카카오_AI엔지니어_이력서.pdf",
  "삼성_SW개발자_이력서.pdf",
]

function getScoreColor(score: number) {
  if (score >= 90) return "text-emerald-600"
  if (score >= 80) return "text-amber-600"
  return "text-red-600"
}

function getDdayBadgeColor(dday: number) {
  if (dday <= -3) return "bg-red-50 text-red-700"
  if (dday <= -7) return "bg-amber-50 text-amber-700"
  return "bg-blue-50 text-blue-700"
}

function getInterviewTypeBg(type: InterviewType) {
  return type === "tech" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"
}

export default function ReportsPage() {
  const [expandedUpcoming, setExpandedUpcoming] = useState<string | null>(null)
  const [expandedPast, setExpandedPast] = useState<string | null>(null)
  const [selectedResume, setSelectedResume] = useState("전체 자소서")
  const [selectedType, setSelectedType] = useState<"all" | "tech" | "human">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredReports = pastReports.filter(report => {
    const resumeMatch = selectedResume === "전체 자소서" || report.resumeId === selectedResume
    const typeMatch = selectedType === "all" || (selectedType === "tech" ? report.type === "tech" : report.type === "human")
    const searchMatch = searchQuery === "" || 
      report.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.role.toLowerCase().includes(searchQuery.toLowerCase())
    return resumeMatch && typeMatch && searchMatch
  })

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="w-full overflow-auto lg:ml-64">
        <MobileHeader />
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              돌아가기
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">리포트</h1>
            <p className="text-sm text-muted-foreground">오늘 기준 {new Date().toLocaleDateString('ko-KR')}</p>
          </div>

          {/* Section 1: Upcoming Interviews */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">다가오는 면접 — 종합 분석</h2>
            <div className="space-y-2">
              {upcomingInterviews.map(interview => (
                <div key={interview.id} className="border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
                  <button
                    onClick={() => setExpandedUpcoming(expandedUpcoming === interview.id ? null : interview.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <Badge className={getDdayBadgeColor(interview.dday)}>D{interview.dday}</Badge>
                      <span className="font-medium text-foreground">{interview.company}</span>
                      <Badge className={getInterviewTypeBg(interview.type)}>
                        {interview.type === "tech" ? "기술" : "인성"}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">{interview.role} · {interview.date} · {interview.resumeFilename}</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform flex-shrink-0", expandedUpcoming === interview.id && "rotate-180")} />
                  </button>

                  {expandedUpcoming === interview.id && (
                    <div className="bg-secondary/20 px-4 py-4 border-t border-border space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">이전 {interview.company} {interview.type === 'tech' ? '기술' : '인성'}면접 기반 분석</span>
                      </div>

                      {interview.previousReports.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {interview.previousReports.map((prev, idx) => (
                            <div key={idx} className="bg-surface rounded-lg p-3 border border-border/50">
                              <div className="text-xs text-muted-foreground mb-1">{prev.type === 'tech' ? '기술' : '인성'}</div>
                              <div className="text-xs text-muted-foreground mb-2">{prev.date}</div>
                              <div className={cn("text-lg font-medium", getScoreColor(prev.score))}>{prev.score}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground leading-relaxed">{interview.aiFeedback}</p>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs">집중 연습</Button>
                        <Button size="sm" variant="outline" className="text-xs">전체 분석</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Past Reports */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">지난 면접 기록</h2>
                {filteredReports.length > 0 && <span className="text-xs text-muted-foreground">{filteredReports.length}건</span>}
              </div>

              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground appearance-none cursor-pointer hover:border-primary/30 focus:border-primary focus:outline-none"
                >
                  {resumes.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <div className="flex gap-1">
                  {(["all", "tech", "human"] as const).map(type => (
                    <Button
                      key={type}
                      size="sm"
                      variant={selectedType === type ? "default" : "outline"}
                      className="text-xs"
                      onClick={() => setSelectedType(type)}
                    >
                      {type === "all" ? "전체" : type === "tech" ? "기술" : "인성"}
                    </Button>
                  ))}
                </div>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="회사, 직무 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border bg-secondary/20 py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report, idx) => (
                  <div key={report.id} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <div className="w-14 text-right">
                        <div className="font-medium text-foreground">{report.date}</div>
                        <div className="text-xs text-muted-foreground">{report.dayOfWeek}</div>
                      </div>
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2",
                        report.type === "tech" ? "border-blue-500 bg-white" : "border-pink-500 bg-white"
                      )} />
                      {idx < filteredReports.length - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>

                    {/* Card */}
                    <div className="flex-1 pb-4">
                      <button
                        onClick={() => setExpandedPast(expandedPast === report.id ? null : report.id)}
                        className="w-full text-left rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-secondary/50 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">
                              {report.company.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{report.company}</div>
                              <div className="text-xs text-muted-foreground">{report.role}</div>
                            </div>
                            <Badge className={getInterviewTypeBg(report.type)} variant="outline">
                              {report.type === "tech" ? "기술" : "인성"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-lg font-medium", getScoreColor(report.totalScore))}>
                              {report.totalScore}
                            </span>
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedPast === report.id && "rotate-180")} />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{report.feedbackPreview}</p>
                      </button>

                      {expandedPast === report.id && (
                        <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-4 space-y-4">
                          <div className="space-y-3">
                            {report.scores.map((score, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-foreground w-14 text-right">{score.label}</span>
                                  <div className="flex-1 mx-2 h-1 bg-border rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full transition-all",
                                        score.value >= 85 ? "bg-emerald-500" : score.value >= 75 ? "bg-amber-500" : "bg-red-500"
                                      )}
                                      style={{ width: `${score.value}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-foreground w-6 text-right">{score.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="text-xs gap-1">
                              <RotateCcw className="h-3 w-3" />
                              재연습
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs gap-1">
                              <BarChart2 className="h-3 w-3" />
                              상세 분석
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

