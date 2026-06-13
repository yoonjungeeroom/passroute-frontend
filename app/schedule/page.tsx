"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/dashboard/top-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar as CalendarIcon,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Loader2,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Schedule } from "@/types/schedule"
import {
  getScheduleCalendar,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleList,
} from "@/lib/api/schedule"
import { getSelfIntroList, type SelfIntroResponse } from "@/lib/api/self-intro"
import { InterviewModal } from "@/components/dashboard/interview-modal"
import { getUserProfile } from "@/lib/api/user"

const DAYS = ["일", "월", "화", "수", "목", "금", "토"]
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

const statusConfig: Record<Schedule["status"], { label: string; className: string }> = {
  SCHEDULED: { label: "예정", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  COMPLETED: { label: "완료", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  CANCELLED: { label: "취소", className: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
}

interface ScheduleForm {
  title: string
  companyName: string
  jobPosition: string
  date: string
  time: string
  location: string
  memo: string
}

const emptyForm: ScheduleForm = {
  title: "",
  companyName: "",
  jobPosition: "",
  date: "",
  time: "",
  location: "",
  memo: "",
}

export default function SchedulePage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<ScheduleForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)

  const [modalTab, setModalTab] = useState<"unscheduled" | "scheduled">("unscheduled")
  const [unscheduledIntros, setUnscheduledIntros] = useState<SelfIntroResponse[]>([])
  const [modalSchedules, setModalSchedules] = useState<Schedule[]>([])
  const [loadingModalData, setLoadingModalData] = useState(false)
  const [schedulingIntroId, setSchedulingIntroId] = useState<number | null>(null)
  const [scheduleInputDate, setScheduleInputDate] = useState("")
  const [scheduleInputTime, setScheduleInputTime] = useState("")
  const [editingModalScheduleId, setEditingModalScheduleId] = useState<number | null>(null)
  const [editModalForm, setEditModalForm] = useState({ date: "", time: "" })
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  // 사용자 이름 fetch
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      getUserProfile()
        .then((u) => setUserName(u.name))
        .catch(() => {})
    }
  }, [])

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const result = await getScheduleCalendar(year, month)
      setSchedules(result.schedules)
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정을 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const fetchModalData = useCallback(async () => {
    setLoadingModalData(true)
    try {
      const [allIntros, allScheds] = await Promise.all([
        getSelfIntroList().catch(() => []),
        getScheduleList().catch(() => []),
      ])
      const linkedIds = new Set(
        allScheds.map((s) => s.selfIntroId).filter((id): id is number => id !== null)
      )
      setUnscheduledIntros(allIntros.filter((intro) => !linkedIds.has(intro.id)))
      setModalSchedules(allScheds)
    } finally {
      setLoadingModalData(false)
    }
  }, [])

  useEffect(() => {
    if (isAddModalOpen) {
      setModalTab("unscheduled")
      setSchedulingIntroId(null)
      setScheduleInputDate("")
      setScheduleInputTime("")
      setEditingModalScheduleId(null)
      fetchModalData()
    }
  }, [isAddModalOpen, fetchModalData])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    return { daysInMonth, startingDay }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate)

  const getInterviewsForDate = (day: number) =>
    schedules.filter((schedule) => {
      const d = new Date(schedule.interviewDate)
      return (
        d.getDate() === day &&
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      )
    })

  const filteredSchedules = useMemo(() => {
    if (selectedDate) {
      return schedules.filter((schedule) => {
        const d = new Date(schedule.interviewDate)
        return (
          d.getDate() === selectedDate.getDate() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        )
      })
    }
    return schedules
  }, [selectedDate, schedules])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    if (
      selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth()
    ) {
      setSelectedDate(null)
    } else {
      setSelectedDate(clickedDate)
    }
  }

  const handleScheduleFromIntro = async (intro: SelfIntroResponse) => {
    if (!scheduleInputDate) return
    try {
      setModalSubmitting(true)
      const interviewDate = scheduleInputTime
        ? `${scheduleInputDate}T${scheduleInputTime}:00`
        : `${scheduleInputDate}T00:00:00`
      await createSchedule({
        title: `${intro.companyName} 면접`,
        companyName: intro.companyName,
        jobPosition: intro.jobPosition,
        interviewDate,
        selfIntroId: intro.id,
      })
      setSchedulingIntroId(null)
      setScheduleInputDate("")
      setScheduleInputTime("")
      await Promise.all([fetchSchedules(), fetchModalData()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 생성에 실패했습니다")
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleEditModalClick = (schedule: Schedule) => {
    const d = new Date(schedule.interviewDate)
    setEditingModalScheduleId(schedule.id)
    setEditModalForm({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    })
  }

  const handleSaveModalEdit = async () => {
    if (!editingModalScheduleId || !editModalForm.date) return
    const schedule = modalSchedules.find((s) => s.id === editingModalScheduleId)
    if (!schedule) return
    try {
      setModalSubmitting(true)
      const interviewDate = editModalForm.time
        ? `${editModalForm.date}T${editModalForm.time}:00`
        : `${editModalForm.date}T00:00:00`
      await updateSchedule(editingModalScheduleId, {
        title: schedule.title,
        companyName: schedule.companyName,
        jobPosition: schedule.jobPosition,
        interviewDate,
        location: schedule.location || undefined,
        memo: schedule.memo || undefined,
      })
      setEditingModalScheduleId(null)
      await Promise.all([fetchSchedules(), fetchModalData()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 수정에 실패했습니다")
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleEditClick = (schedule: Schedule) => {
    const d = new Date(schedule.interviewDate)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    setEditingId(schedule.id)
    setFormData({
      title: schedule.title,
      companyName: schedule.companyName,
      jobPosition: schedule.jobPosition,
      date: dateStr,
      time: timeStr,
      location: schedule.location || "",
      memo: schedule.memo || "",
    })
  }

  const handleSaveEdit = async () => {
    if (
      editingId === null ||
      !formData.title ||
      !formData.companyName ||
      !formData.jobPosition ||
      !formData.date
    )
      return
    try {
      setSubmitting(true)
      const interviewDate = formData.time
        ? `${formData.date}T${formData.time}:00`
        : `${formData.date}T00:00:00`
      await updateSchedule(editingId, {
        title: formData.title,
        companyName: formData.companyName,
        jobPosition: formData.jobPosition,
        interviewDate,
        location: formData.location || undefined,
        memo: formData.memo || undefined,
      })
      setEditingId(null)
      setFormData(emptyForm)
      await fetchSchedules()
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 수정에 실패했습니다")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (scheduleId: number) => {
    setDeleteTargetId(null)
    try {
      await deleteSchedule(scheduleId)
      await fetchSchedules()
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 삭제에 실패했습니다")
    }
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear()
    )
  }

  const formatScheduleDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${dayNames[d.getDay()]})`
  }

  const formatScheduleTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

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

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <TopNav userName={userName} />

      <main className="mx-auto w-full max-w-[1040px] px-6 py-9">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">면접 일정 관리</h1>
            <p className="mt-1 text-sm text-slate-500">전체 {schedules.length}개의 면접 일정</p>
          </div>
          <Button
            onClick={() => {
              setFormData(emptyForm)
              setIsAddModalOpen(true)
            }}
            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            일정 관리
          </Button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-500">
            {error}
            <button className="ml-2 underline" onClick={() => setError("")}>닫기</button>
          </div>
        )}

        {/* Calendar Card */}
        <Card className="mb-3 rounded-2xl border border-slate-200 bg-white">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base font-semibold text-slate-900">
                {currentDate.getFullYear()}년 {MONTHS[currentDate.getMonth()]}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day, idx) => (
                <div
                  key={day}
                  className={cn(
                    "py-2 text-center text-xs font-medium",
                    idx === 0 ? "text-rose-400" : idx === 6 ? "text-blue-400" : "text-slate-400"
                  )}
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square p-0.5" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const interviews = getInterviewsForDate(day)
                const hasInterviews = interviews.length > 0
                const dayOfWeek = (startingDay + i) % 7

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "relative flex aspect-square flex-col overflow-hidden rounded-lg p-1 text-sm transition-all",
                      isSelected(day)
                        ? "bg-blue-600 ring-2 ring-blue-600 ring-offset-2"
                        : isToday(day)
                        ? "bg-blue-50 ring-1 ring-blue-300"
                        : hasInterviews
                        ? "hover:bg-slate-100"
                        : "hover:bg-slate-100"
                    )}
                  >
                    <span
                      className={cn(
                        "self-center text-xs font-medium leading-none",
                        isSelected(day)
                          ? "text-white"
                          : isToday(day)
                          ? "font-bold text-blue-600"
                          : dayOfWeek === 0
                          ? "text-rose-400"
                          : dayOfWeek === 6
                          ? "text-blue-400"
                          : "text-slate-900"
                      )}
                    >
                      {day}
                    </span>
                    {hasInterviews && (
                      <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                        {interviews.slice(0, 2).map((schedule) => (
                          <span
                            key={schedule.id}
                            className={cn(
                              "truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight lg:text-[10px]",
                              isSelected(day)
                                ? "bg-white/30 text-white"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            {schedule.companyName}
                          </span>
                        ))}
                        {interviews.length > 2 && (
                          <span
                            className={cn(
                              "text-center text-[8px] font-medium",
                              isSelected(day) ? "text-white/70" : "text-slate-400"
                            )}
                          >
                            +{interviews.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filter Status Bar */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {selectedDate ? (
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-600">
                  {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                </Badge>
                <span>{filteredSchedules.length}개 일정</span>
              </span>
            ) : (
              <span>{filteredSchedules.length}개 일정</span>
            )}
          </p>
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-slate-400 hover:text-slate-700"
              onClick={() => setSelectedDate(null)}
            >
              <RotateCcw className="h-3 w-3" />
              전체 보기
            </Button>
          )}
        </div>

        {/* Schedule List */}
        <Card className="rounded-2xl border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              {selectedDate
                ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`
                : "전체 일정"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="mb-3 h-12 w-12 text-slate-200" />
                <p className="text-sm text-slate-400">
                  {selectedDate ? "선택한 날짜에 일정이 없습니다" : "등록된 면접 일정이 없습니다"}
                </p>
              </div>
            ) : (
              filteredSchedules.map((schedule) => {
                const dDay = getDDay(schedule.interviewDate)
                const sConfig = statusConfig[schedule.status] || { label: schedule.status, className: "" }
                const isEditing = editingId === schedule.id

                return (
                  <div
                    key={schedule.id}
                    className={cn(
                      "group relative rounded-xl border p-4 transition-all duration-300",
                      isEditing
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm"
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold text-slate-900">{schedule.companyName}</h4>
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-600 text-xs">
                            {schedule.title}
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", sConfig.className)}>
                            {sConfig.label}
                          </Badge>
                          {schedule.status === "SCHEDULED" && (
                            <span className="text-xs font-medium text-slate-400">{getDDayLabel(dDay)}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {schedule.jobPosition}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {formatScheduleDate(schedule.interviewDate)} {formatScheduleTime(schedule.interviewDate)}
                          </span>
                          {schedule.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {schedule.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => handleEditClick(schedule)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-rose-200 text-xs text-rose-500 hover:bg-rose-50"
                            onClick={() => setDeleteTargetId(schedule.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            삭제
                          </Button>
                          {schedule.status === "SCHEDULED" && (
                            <Button
                              size="sm"
                              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => setIsInterviewModalOpen(true)}
                            >
                              <Play className="h-3.5 w-3.5" />
                              연습하기
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline Edit Form */}
                    {isEditing && (
                      <div className="mt-4 space-y-3 rounded-lg border border-blue-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">일정 수정</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">제목</Label>
                            <Input
                              value={formData.title}
                              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">회사명</Label>
                            <Input
                              value={formData.companyName}
                              onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">직무</Label>
                            <Input
                              value={formData.jobPosition}
                              onChange={(e) => setFormData((prev) => ({ ...prev, jobPosition: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">장소</Label>
                            <Input
                              value={formData.location}
                              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                              placeholder="선택 사항"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">날짜</Label>
                            <Input
                              type="date"
                              value={formData.date}
                              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">시간</Label>
                            <Input
                              type="time"
                              value={formData.time}
                              onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">메모</Label>
                          <Textarea
                            value={formData.memo}
                            onChange={(e) => setFormData((prev) => ({ ...prev, memo: e.target.value }))}
                            placeholder="선택 사항"
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditingId(null); setFormData(emptyForm) }}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            disabled={!formData.title || !formData.companyName || !formData.jobPosition || !formData.date || submitting}
                            onClick={handleSaveEdit}
                          >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "저장"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add / Manage Schedule Modal */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open)
          if (!open) {
            setSchedulingIntroId(null)
            setScheduleInputDate("")
            setScheduleInputTime("")
            setEditingModalScheduleId(null)
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Plus className="h-5 w-5 text-blue-600" />
              일정 관리
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              일정이 미정인 자기소개서를 선택하거나 기존 일정을 수정하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => { setModalTab("unscheduled"); setSchedulingIntroId(null) }}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition-all",
                modalTab === "unscheduled"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              )}
            >
              일정 미정
            </button>
            <button
              onClick={() => { setModalTab("scheduled"); setEditingModalScheduleId(null) }}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition-all",
                modalTab === "scheduled"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              )}
            >
              일정 확정
            </button>
          </div>

          {loadingModalData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : modalTab === "unscheduled" ? (
            <div className="mt-1 space-y-3">
              {unscheduledIntros.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">일정이 미정인 자기소개서가 없습니다</p>
                </div>
              ) : (
                unscheduledIntros.map((intro) => (
                  <div
                    key={intro.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all duration-200",
                      schedulingIntroId === intro.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{intro.companyName}</p>
                        <p className="flex items-center gap-1 text-sm text-slate-500">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{intro.jobPosition}</span>
                          {intro.interviewStage && (
                            <Badge variant="outline" className="ml-1 shrink-0 text-[10px]">
                              {intro.interviewStage}
                            </Badge>
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={schedulingIntroId === intro.id ? "secondary" : "outline"}
                        className="shrink-0 gap-1.5 text-xs"
                        onClick={() => {
                          if (schedulingIntroId === intro.id) {
                            setSchedulingIntroId(null)
                          } else {
                            setSchedulingIntroId(intro.id)
                            setScheduleInputDate(intro.interviewDate ?? "")
                            setScheduleInputTime(intro.interviewTime ?? "")
                          }
                        }}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        일정 설정
                      </Button>
                    </div>

                    {schedulingIntroId === intro.id && (
                      <div className="mt-3 space-y-3 rounded-lg border border-blue-200 bg-white p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">날짜 *</Label>
                            <Input
                              type="date"
                              value={scheduleInputDate}
                              onChange={(e) => setScheduleInputDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">시간</Label>
                            <Input
                              type="time"
                              value={scheduleInputTime}
                              onChange={(e) => setScheduleInputTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setSchedulingIntroId(null)}>
                            취소
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            disabled={!scheduleInputDate || modalSubmitting}
                            onClick={() => handleScheduleFromIntro(intro)}
                          >
                            {modalSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "등록"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="mt-1 space-y-3">
              {modalSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">등록된 일정이 없습니다</p>
                </div>
              ) : (
                modalSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all duration-200",
                      editingModalScheduleId === schedule.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{schedule.companyName}</p>
                        <p className="flex items-center gap-1 text-sm text-slate-500">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{schedule.jobPosition}</span>
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <CalendarIcon className="h-3 w-3 shrink-0" />
                          {formatScheduleDate(schedule.interviewDate)}{" "}
                          {formatScheduleTime(schedule.interviewDate)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={editingModalScheduleId === schedule.id ? "secondary" : "outline"}
                        className="shrink-0 gap-1.5 text-xs"
                        onClick={() => {
                          if (editingModalScheduleId === schedule.id) {
                            setEditingModalScheduleId(null)
                          } else {
                            handleEditModalClick(schedule)
                          }
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        수정
                      </Button>
                    </div>

                    {editingModalScheduleId === schedule.id && (
                      <div className="mt-3 space-y-3 rounded-lg border border-blue-200 bg-white p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">날짜 *</Label>
                            <Input
                              type="date"
                              value={editModalForm.date}
                              onChange={(e) => setEditModalForm((prev) => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-400">시간</Label>
                            <Input
                              type="time"
                              value={editModalForm.time}
                              onChange={(e) => setEditModalForm((prev) => ({ ...prev, time: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingModalScheduleId(null)}>
                            취소
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            disabled={!editModalForm.date || modalSubmitting}
                            onClick={handleSaveModalEdit}
                          >
                            {modalSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "저장"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 일정을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 text-white hover:bg-rose-600"
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InterviewModal
        open={isInterviewModalOpen}
        onOpenChange={setIsInterviewModalOpen}
      />
    </div>
  )
}
