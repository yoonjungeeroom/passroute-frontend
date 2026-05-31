"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Briefcase, ChevronRight, Play, Loader2, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Schedule } from "@/types/schedule"
import { getScheduleList } from "@/lib/api/schedule"

interface UpcomingScheduleProps {
  onStartInterview?: () => void
}

export function UpcomingSchedule({ onStartInterview }: UpcomingScheduleProps) {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const data = await getScheduleList()
        // 예정된 일정만 필터링하고, 가까운 날짜 순으로 최대 3개만 표시
        const upcoming = data
          .filter(s => s.status === "SCHEDULED" && new Date(s.interviewDate) >= new Date())
          .slice(0, 3)
        setSchedules(upcoming)
      } catch {
        // 조용히 실패 - 대시보드 위젯이므로
      } finally {
        setLoading(false)
      }
    }
    fetchSchedules()
  }, [])

  const getDDay = (dateStr: string) => {
    const target = new Date(dateStr)
    const now = new Date()
    target.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${dayNames[d.getDay()]})`
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  const handlePractice = () => {
    onStartInterview?.()
  }

  return (
    <Card className="border-border bg-white rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
          <Calendar className="h-4.5 w-4.5 text-muted-foreground" />
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-text-muted)]" />
          </div>
        ) : schedules.length > 0 ? (
          schedules.map((schedule) => {
            const dDay = getDDay(schedule.interviewDate)
            const isUrgent = dDay <= 3

            return (
              <div
                key={schedule.id}
                className={cn(
                  "group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 hover:bg-gray-50",
                  "border-[var(--color-border)] bg-white"
                )}
              >
                {/* D-Day Badge */}
                <div className={cn(
                  "flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl font-medium",
                  getDDayStyle(dDay)
                )}>
                  <span className="text-lg font-bold">{getDDayLabel(dDay)}</span>
                </div>

                {/* Interview Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="truncate text-base font-semibold text-[var(--color-text)]">
                      {schedule.companyName}
                    </h4>
                    <Badge variant="outline" className="border-[var(--color-border)] bg-white text-xs text-[var(--color-text-muted)]">
                      {schedule.title}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {schedule.jobPosition}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(schedule.interviewDate)} {formatTime(schedule.interviewDate)}
                    </span>
                    {schedule.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {schedule.location}
                      </span>
                    )}
                  </div>
                </div>

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
                  onClick={handlePractice}
                >
                  <Play className="h-3.5 w-3.5" />
                  연습하기
                </Button>
              </div>
            )
          })
        ) : (
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
