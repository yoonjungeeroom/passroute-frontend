"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Briefcase, ChevronRight, Play, Loader2, MapPin, Clock } from "lucide-react"
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
  const getDDayLabel = (dDay: number) => (dDay === 0 ? "D-Day" : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`)
  const getDDayStyle = (dDay: number) => {
    if (dDay <= 0) return "bg-rose-500 text-white"
    if (dDay <= 3) return "bg-blue-600 text-white"
    if (dDay <= 7) return "bg-amber-500 text-white"
    return "bg-slate-200 text-slate-600"
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

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h3 className="text-[22px] font-extrabold tracking-tight text-slate-900">다가오는 면접 일정</h3>
        <button onClick={() => router.push("/schedule")} className="flex items-center gap-0.5 text-xs font-semibold text-slate-400 hover:text-slate-600">
          전체보기 <ChevronRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-10">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : schedules.length > 0 ? (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const dDay = getDDay(schedule.interviewDate)
            const isUrgent = dDay <= 3
            return (
              <div key={schedule.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300">
                <div className={cn("flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl", getDDayStyle(dDay))}>
                  <span className="text-[17px] font-extrabold leading-none">{getDDayLabel(dDay)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-[15px] font-bold text-slate-900">{schedule.companyName}</h4>
                    <span className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">{schedule.title}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-400">
                    <span className="flex items-center gap-1"><Briefcase size={13} /> {schedule.jobPosition}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {formatDate(schedule.interviewDate)} {formatTime(schedule.interviewDate)}</span>
                    {schedule.location && <span className="flex items-center gap-1"><MapPin size={13} /> {schedule.location}</span>}
                  </div>
                </div>
                <button
                  onClick={() => onStartInterview?.()}
                  className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold transition-colors",
                    isUrgent ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}
                >
                  <Play size={14} fill="currentColor" strokeWidth={0} /> 연습하기
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center">
          <Calendar size={30} className="mb-2 text-slate-300" />
          <p className="text-sm text-slate-400">등록된 면접 일정이 없습니다</p>
          <button onClick={() => router.push("/schedule")} className="mt-1 text-sm font-semibold text-blue-600 hover:text-blue-700">면접 일정 추가하기</button>
        </div>
      )}
    </section>
  )
}
