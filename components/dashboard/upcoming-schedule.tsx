"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Briefcase, CheckCircle, Clock, AlertCircle, ChevronRight, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface UpcomingInterview {
  id: string
  company: string
  role: string
  date: string
  time: string
  dDay: number
  stage: string
  preparationStatus: "ready" | "inProgress" | "notStarted"
}

const upcomingInterviews: UpcomingInterview[] = [
  {
    id: "1",
    company: "카카오",
    role: "AI 엔지니어",
    date: "2026.04.05 (토)",
    time: "14:00",
    dDay: 3,
    stage: "기술 면접",
    preparationStatus: "ready",
  },
  {
    id: "2",
    company: "네이버",
    role: "프론트엔드 개발자",
    date: "2026.04.10 (목)",
    time: "10:00",
    dDay: 8,
    stage: "임원 면접",
    preparationStatus: "inProgress",
  },
  {
    id: "3",
    company: "라인",
    role: "백엔드 개발자",
    date: "2026.04.15 (화)",
    time: "15:00",
    dDay: 13,
    stage: "실무 면접",
    preparationStatus: "notStarted",
  },
]

const preparationConfig = {
  ready: {
    label: "준비 완료",
    icon: CheckCircle,
    className: "bg-emerald-100 text-emerald-700 border-emerald-300",
  },
  inProgress: {
    label: "준비 중",
    icon: Clock,
    className: "bg-amber-100 text-amber-700 border-amber-300",
  },
  notStarted: {
    label: "준비 필요",
    icon: AlertCircle,
    className: "bg-rose-100 text-rose-700 border-rose-300",
  },
}

export function UpcomingSchedule() {
  const router = useRouter()

  const getDDayLabel = (dDay: number) => {
    if (dDay === 0) return "D-Day"
    if (dDay > 0) return `D-${dDay}`
    return `D+${Math.abs(dDay)}`
  }

  const getDDayStyle = (dDay: number) => {
    if (dDay <= 0) return "bg-rose-600 text-white"
    if (dDay <= 3) return "bg-[var(--color-primary)] text-white"
    if (dDay <= 7) return "bg-amber-500 text-white"
    return "bg-gray-300 text-gray-700"
  }

  return (
    <Card className="border-[var(--color-border)] bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
          <Calendar className="h-4.5 w-4.5 text-[var(--color-accent)]" />
          다가오는 면접 일정
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          onClick={() => router.push("/schedule")}
        >
          전체보기
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingInterviews.map((interview) => {
          const prepConfig = preparationConfig[interview.preparationStatus]
          const PrepIcon = prepConfig.icon
          const isUrgent = interview.dDay <= 3

          return (
            <div
              key={interview.id}
              className={cn(
                "group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 hover:bg-gray-50",
                isUrgent 
                  ? "border-[var(--color-border)] bg-white" 
                  : "border-[var(--color-border)] bg-white"
              )}
            >
              {/* D-Day Badge */}
                <div className={cn(
                "flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl font-medium",
                getDDayStyle(interview.dDay)
              )}>
                <span className="text-lg font-bold">{getDDayLabel(interview.dDay)}</span>
              </div>

              {/* Interview Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="truncate text-base font-semibold text-[var(--color-text)]">
                    {interview.company}
                  </h4>
                  <Badge variant="outline" className="border-[var(--color-border)] bg-white text-xs text-[var(--color-text-muted)]">
                    {interview.stage}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {interview.role}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {interview.date} {interview.time}
                  </span>
                </div>
              </div>

              {/* Preparation Status */}
              <Badge variant="outline" className={cn("flex-shrink-0 hidden sm:flex", prepConfig.className)}>
                <PrepIcon className="mr-1 h-3 w-3" />
                {prepConfig.label}
              </Badge>

              {/* Quick Action */}
              <Button 
                size="sm" 
                variant={isUrgent ? "default" : "secondary"}
                className={cn(
                  "flex-shrink-0 gap-1",
                  isUrgent 
                    ? "bg-[var(--color-primary)] text-white hover:opacity-90" 
                    : "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-gray-50"
                )}
              >
                <Play className="h-3.5 w-3.5" />
                연습하기
              </Button>
            </div>
          )
        })}

        {upcomingInterviews.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-white py-8 text-center">
            <Calendar className="mb-2 h-8 w-8 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">등록된 면접 일정이 없습니다</p>
            <Button 
              variant="link" 
              size="sm" 
              className="mt-1 h-auto p-0 text-[var(--color-primary)]"
              onClick={() => router.push("/schedule")}
            >
              면접 일정 추가하기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
