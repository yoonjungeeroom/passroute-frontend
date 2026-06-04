"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
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
  MapPin
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

const DAYS = ["일", "월", "화", "수", "목", "금", "토"]
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

const statusConfig: Record<Schedule["status"], { label: string; className: string }> = {
  SCHEDULED: {
    label: "예정",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  COMPLETED: {
    label: "완료",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  CANCELLED: {
    label: "취소",
    className: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
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

  // 일정 추가 모달 - 탭 및 데이터
  const [modalTab, setModalTab] = useState<"unscheduled" | "scheduled">("unscheduled")
  const [unscheduledIntros, setUnscheduledIntros] = useState<SelfIntroResponse[]>([])
  const [modalSchedules, setModalSchedules] = useState<Schedule[]>([])
  const [loadingModalData, setLoadingModalData] = useState(false)
  // 일정 미정 탭 - 날짜 설정 인라인 폼
  const [schedulingIntroId, setSchedulingIntroId] = useState<number | null>(null)
  const [scheduleInputDate, setScheduleInputDate] = useState("")
  const [scheduleInputTime, setScheduleInputTime] = useState("")
  // 일정 확정 탭 - 수정 인라인 폼
  const [editingModalScheduleId, setEditingModalScheduleId] = useState<number | null>(null)
  const [editModalForm, setEditModalForm] = useState({ date: "", time: "" })
  const [modalSubmitting, setModalSubmitting] = useState(false)

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
      const linkedIds = new Set(allScheds.map(s => s.selfIntroId).filter((id): id is number => id !== null))
      setUnscheduledIntros(allIntros.filter(intro => !linkedIds.has(intro.id)))
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

  const getInterviewsForDate = (day: number) => {
    return schedules.filter(schedule => {
      const d = new Date(schedule.interviewDate)
      return (
        d.getDate() === day &&
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  const filteredSchedules = useMemo(() => {
    if (selectedDate) {
      return schedules.filter(schedule => {
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
    if (selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth()) {
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
    const schedule = modalSchedules.find(s => s.id === editingModalScheduleId)
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
    if (editingId === null || !formData.title || !formData.companyName || !formData.jobPosition || !formData.date) return
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

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const handleDelete = async (scheduleId: number) => {
    setDeleteTargetId(null)
    try {
      await deleteSchedule(scheduleId)
      await fetchSchedules()
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 삭제에 실패했습니다")
    }
  }

  const handlePractice = () => {
    setIsInterviewModalOpen(true)
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
    <div className="flex min-h-screen flex-col bg-background">
      <Sidebar />
      <MobileHeader />

      <main className="flex flex-1 flex-col pt-14 lg:pl-64 lg:pt-0">
        {/* Header */}
        <div className="sticky top-14 z-30 border-b border-border/30 bg-background/95 backdrop-blur-sm lg:top-0">
          <div className="flex items-center justify-between px-4 pt-8 pb-5 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">면접 일정 관리</h1>
              <p className="text-sm text-muted-foreground mt-1">전체 {schedules.length}개의 면접 일정</p>
            </div>
            <Button
              onClick={() => {
                setFormData(emptyForm)
                setIsAddModalOpen(true)
              }}
              className="gap-1.5 bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">일정 추가</span>
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400 lg:mx-6">
            {error}
            <button className="ml-2 underline" onClick={() => setError("")}>닫기</button>
          </div>
        )}

        {/* Calendar Card */}
        <div className="bg-background px-4 pb-2 pt-4 sm:px-6 lg:px-8">
          <Card className="border-border bg-white rounded-xl">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base font-semibold text-foreground">
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
                      idx === 0 ? "text-rose-400" : idx === 6 ? "text-blue-400" : "text-muted-foreground"
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
                        "relative flex aspect-square flex-col rounded-lg p-1 text-sm transition-all overflow-hidden",
                        isSelected(day)
                          ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : isToday(day)
                            ? "bg-secondary/40 ring-1 ring-primary/50"
                            : hasInterviews
                              ? "hover:bg-secondary/20"
                              : "hover:bg-secondary/40"
                      )}
                    >
                      <span className={cn(
                        "self-center text-xs font-medium leading-none",
                        isSelected(day)
                          ? "text-primary-foreground"
                          : isToday(day)
                            ? "text-primary font-bold"
                            : dayOfWeek === 0
                              ? "text-rose-400"
                              : dayOfWeek === 6
                                ? "text-blue-400"
                                : "text-foreground"
                      )}>
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
                                  ? "bg-primary-foreground/30 text-primary-foreground"
                                  : "bg-primary/15 text-primary"
                              )}
                            >
                              {schedule.companyName}
                            </span>
                          ))}
                          {interviews.length > 2 && (
                            <span className={cn(
                              "text-center text-[8px] font-medium",
                              isSelected(day) ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
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
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedDate ? (
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">
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
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedDate(null)}
              >
                <RotateCcw className="h-3 w-3" />
                전체 보기
              </Button>
            )}
          </div>
        </div>

        {/* Schedule List */}
        <div className="flex-1 overflow-auto px-4 py-4 sm:px-6 lg:px-8">
          <Card className="border-border bg-white rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {selectedDate
                  ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`
                  : "전체 일정"
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
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
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/50 bg-secondary/10 hover:bg-secondary/20"
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold text-foreground">
                              {schedule.companyName}
                            </h4>
                            <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-xs">
                              {schedule.title}
                            </Badge>
                            <Badge variant="outline" className={cn("text-xs", sConfig.className)}>
                              {sConfig.label}
                            </Badge>
                            {schedule.status === "SCHEDULED" && (
                              <span className="text-xs font-medium text-muted-foreground">
                                {getDDayLabel(dDay)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
                              className="gap-1.5 border-border/50 text-xs hover:bg-secondary"
                              onClick={() => handleEditClick(schedule)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              수정
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 border-rose-500/30 text-xs text-rose-400 hover:bg-rose-500/10"
                              onClick={() => setDeleteTargetId(schedule.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              삭제
                            </Button>
                            {schedule.status === "SCHEDULED" && (
                              <Button
                                size="sm"
                                className="gap-1.5 bg-primary text-white hover:bg-primary/90"
                                onClick={handlePractice}
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
                        <div className="mt-4 space-y-3 rounded-lg border border-primary/30 bg-card p-4">
                          <p className="text-sm font-medium text-foreground">일정 수정</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">제목</Label>
                              <Input
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="border-border/50 bg-secondary/30"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">회사명</Label>
                              <Input
                                value={formData.companyName}
                                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                className="border-border/50 bg-secondary/30"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">직무</Label>
                              <Input
                                value={formData.jobPosition}
                                onChange={(e) => setFormData(prev => ({ ...prev, jobPosition: e.target.value }))}
                                className="border-border/50 bg-secondary/30"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">장소</Label>
                              <Input
                                value={formData.location}
                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                className="border-border/50 bg-secondary/30"
                                placeholder="선택 사항"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">날짜</Label>
                              <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                className="border-border/50 bg-secondary/30"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">시간</Label>
                              <Input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                className="border-border/50 bg-secondary/30"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">메모</Label>
                            <Textarea
                              value={formData.memo}
                              onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                              className="border-border/50 bg-secondary/30"
                              placeholder="선택 사항"
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null)
                                setFormData(emptyForm)
                              }}
                            >
                              취소
                            </Button>
                            <Button
                              size="sm"
                              className="bg-primary text-white hover:bg-primary/90"
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
        </div>
      </main>

      {/* Add Schedule Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open)
        if (!open) {
          setSchedulingIntroId(null)
          setScheduleInputDate("")
          setScheduleInputTime("")
          setEditingModalScheduleId(null)
        }
      }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-border/50 bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Plus className="h-5 w-5 text-primary" />
              일정 추가
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              일정이 미정인 자기소개서를 선택하거나 새 일정을 등록하세요.
            </DialogDescription>
          </DialogHeader>

          {/* 탭 전환 */}
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-secondary/30 p-1">
            <button
              onClick={() => {
                setModalTab("unscheduled")
                setSchedulingIntroId(null)
              }}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition-all",
                modalTab === "unscheduled"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              일정 미정
            </button>
            <button
              onClick={() => {
                setModalTab("scheduled")
                setEditingModalScheduleId(null)
              }}
              className={cn(
                "rounded-lg py-2 text-sm font-medium transition-all",
                modalTab === "scheduled"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              일정 확정
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          {loadingModalData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : modalTab === "unscheduled" ? (
            <div className="mt-1 space-y-3">
              {unscheduledIntros.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">일정이 미정인 자기소개서가 없습니다</p>
                </div>
              ) : (
                unscheduledIntros.map((intro) => (
                  <div
                    key={intro.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all duration-200",
                      schedulingIntroId === intro.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{intro.companyName}</p>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{intro.jobPosition}</span>
                          {intro.interviewStage && (
                            <Badge variant="outline" className="ml-1 shrink-0 border-border/50 text-[10px]">
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
                      <div className="mt-3 space-y-3 rounded-lg border border-primary/30 bg-card p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">날짜 *</Label>
                            <Input
                              type="date"
                              value={scheduleInputDate}
                              onChange={(e) => setScheduleInputDate(e.target.value)}
                              className="border-border/50 bg-secondary/30"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">시간</Label>
                            <Input
                              type="time"
                              value={scheduleInputTime}
                              onChange={(e) => setScheduleInputTime(e.target.value)}
                              className="border-border/50 bg-secondary/30"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSchedulingIntroId(null)}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary text-white hover:bg-primary/90"
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
                  <CalendarIcon className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">등록된 일정이 없습니다</p>
                </div>
              ) : (
                modalSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all duration-200",
                      editingModalScheduleId === schedule.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/50 bg-secondary/20 hover:bg-secondary/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{schedule.companyName}</p>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{schedule.jobPosition}</span>
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
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
                      <div className="mt-3 space-y-3 rounded-lg border border-primary/30 bg-card p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">날짜 *</Label>
                            <Input
                              type="date"
                              value={editModalForm.date}
                              onChange={(e) => setEditModalForm(prev => ({ ...prev, date: e.target.value }))}
                              className="border-border/50 bg-secondary/30"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">시간</Label>
                            <Input
                              type="time"
                              value={editModalForm.time}
                              onChange={(e) => setEditModalForm(prev => ({ ...prev, time: e.target.value }))}
                              className="border-border/50 bg-secondary/30"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingModalScheduleId(null)}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary text-white hover:bg-primary/90"
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
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 일정을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => deleteTargetId && handleDelete(deleteTargetId)}>삭제</AlertDialogAction>
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
