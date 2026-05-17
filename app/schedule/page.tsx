"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Calendar as CalendarIcon, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Play, 
  Plus,
  Pencil,
  X,
  RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Interview {
  id: string
  company: string
  role: string
  date: string
  time: string
  dDay: number
  stage: string
  preparationStatus: "ready" | "inProgress" | "notStarted"
  calendarDate: Date
}

interface UnscheduledInterview {
  id: string
  company: string
  role: string
  stage: string
}

const defaultInterviews: Interview[] = [
  {
    id: "1",
    company: "카카오",
    role: "AI 엔지니어",
    date: "2026.04.05",
    time: "14:00",
    dDay: 3,
    stage: "기술 면접",
    preparationStatus: "ready",
    calendarDate: new Date(2026, 3, 5),
  },
  {
    id: "2",
    company: "네이버",
    role: "프론트엔드 개발자",
    date: "2026.04.10",
    time: "10:00",
    dDay: 8,
    stage: "임원 면접",
    preparationStatus: "inProgress",
    calendarDate: new Date(2026, 3, 10),
  },
  {
    id: "3",
    company: "라인",
    role: "백엔드 개발자",
    date: "2026.04.15",
    time: "15:00",
    dDay: 13,
    stage: "실무 면접",
    preparationStatus: "notStarted",
    calendarDate: new Date(2026, 3, 15),
  },
  {
    id: "4",
    company: "쿠팡",
    role: "데이터 엔지니어",
    date: "2026.04.20",
    time: "11:00",
    dDay: 18,
    stage: "인성 면접",
    preparationStatus: "notStarted",
    calendarDate: new Date(2026, 3, 20),
  },
  {
    id: "5",
    company: "토스",
    role: "iOS 개발자",
    date: "2026.04.05",
    time: "09:00",
    dDay: 3,
    stage: "직무 면접",
    preparationStatus: "notStarted",
    calendarDate: new Date(2026, 3, 5),
  },
]

const unscheduledInterviewsDefault: UnscheduledInterview[] = [
  { id: "u1", company: "삼성전자", role: "SW 개발자", stage: "기술 면접" },
  { id: "u2", company: "SK하이닉스", role: "임베디드 개발자", stage: "실무 면접" },
]

const preparationConfig = {
  ready: {
    label: "준비 완료",
    icon: CheckCircle,
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  inProgress: {
    label: "준비 중",
    icon: Clock,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  notStarted: {
    label: "준비 필요",
    icon: AlertCircle,
    className: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"]
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

export default function SchedulePage() {
  const [allInterviews, setAllInterviews] = useState<Interview[]>(defaultInterviews)
  const [unscheduledInterviews, setUnscheduledInterviews] = useState<UnscheduledInterview[]>(unscheduledInterviewsDefault)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [settingScheduleFor, setSettingScheduleFor] = useState<string | null>(null)
  const [editingScheduleFor, setEditingScheduleFor] = useState<string | null>(null)
  const [newSchedule, setNewSchedule] = useState({ date: "", time: "" })

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
    return allInterviews.filter(interview => {
      const interviewDate = interview.calendarDate
      return (
        interviewDate.getDate() === day &&
        interviewDate.getMonth() === currentDate.getMonth() &&
        interviewDate.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  const filteredInterviews = useMemo(() => {
    if (selectedDate) {
      // 특정 날짜 선택 시 그 날짜의 일정만
      return allInterviews.filter(interview => {
        const interviewDate = interview.calendarDate
        return (
          interviewDate.getDate() === selectedDate.getDate() &&
          interviewDate.getMonth() === selectedDate.getMonth() &&
          interviewDate.getFullYear() === selectedDate.getFullYear()
        )
      })
    } else {
      // 선택된 날짜가 없으면 현재 월의 모든 일정
      return allInterviews.filter(interview => {
        const interviewDate = interview.calendarDate
        return (
          interviewDate.getMonth() === currentDate.getMonth() &&
          interviewDate.getFullYear() === currentDate.getFullYear()
        )
      })
    }
  }, [selectedDate, currentDate, allInterviews])

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

  const handleEditClick = (interviewId: string) => {
    const interview = allInterviews.find(i => i.id === interviewId)
    if (interview) {
      setEditingScheduleFor(interviewId)
      // Parse the date to set the input values (YYYY.MM.DD -> YYYY-MM-DD)
      const dateParts = interview.date.split('.')
      const formattedDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`
      // Time is stored as HH:MM in 24-hour format
      setNewSchedule({ date: formattedDate, time: interview.time })
    }
  }

  const handleCancelEdit = () => {
    setEditingScheduleFor(null)
    setNewSchedule({ date: "", time: "" })
  }

  const handleSaveEdit = () => {
    if (editingScheduleFor && newSchedule.date) {
      try {
        // newSchedule.date는 "YYYY-MM-DD" 형식이어야 함
        const dateParts = newSchedule.date.split('-')
        if (dateParts.length !== 3) {
          return // 유효하지 않은 날짜 형식
        }
        
        const year = parseInt(dateParts[0])
        const month = parseInt(dateParts[1])
        const day = parseInt(dateParts[2])
        
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          return // 숫자 파싱 실패
        }
        
        // 일정 정보 업데이트
        const updatedInterviews = allInterviews.map(interview => {
          if (interview.id === editingScheduleFor) {
            const newCalendarDate = new Date(year, month - 1, day)
            const displayDate = `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
            
            // 시간은 입력이 있으면 사용, 없으면 기존값 유지
            const timeValue = newSchedule.time || interview.time
            
            return {
              ...interview,
              date: displayDate,
              time: timeValue,
              calendarDate: newCalendarDate
            }
          }
          return interview
        })
        setAllInterviews(updatedInterviews)
        setEditingScheduleFor(null)
        setNewSchedule({ date: "", time: "" })
      } catch (error) {
        console.error("Error saving edit:", error)
      }
    }
  }

  const isToday = (day: number) => {
    // 특정 날짜를 오늘로 설정 (2026.04.05 고정)
    const today = new Date(2026, 3, 5)
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Sidebar />
      <MobileHeader />
      
      <main className="flex flex-1 flex-col pt-14 lg:pl-64 lg:pt-0">
        {/* Header - Fixed */}
        <div className="sticky top-14 z-30 border-b border-border/50 bg-card/95 backdrop-blur-sm lg:top-0">
          <div className="flex items-center justify-between p-4 lg:p-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground lg:text-xl">면접 일정 관리</h1>
                <p className="text-xs text-muted-foreground lg:text-sm">전체 {allInterviews.length}개의 면접 일정</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 text-white hover:opacity-90"
              style={{ backgroundColor: "#61A4BC" }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">일정 추가</span>
            </Button>
          </div>
        </div>

        {/* Calendar Card - Scrollable */}
        <div className="bg-background px-4 pb-2 pt-4 lg:px-6">
          <Card className="border-border/50 bg-card shadow-lg shadow-black/5">
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
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
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

                {/* Empty cells for starting day */}
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square p-0.5" />
                ))}

                {/* Day cells */}
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
                        "relative flex min-h-[52px] flex-col rounded-lg p-1 text-sm transition-all lg:min-h-[60px]",
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
                          {interviews.slice(0, 2).map((interview, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                "truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight lg:text-[10px]",
                                isSelected(day) 
                                  ? "bg-primary-foreground/30 text-primary-foreground" 
                                  : "bg-primary/15 text-primary"
                              )}
                            >
                              {interview.company}
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
                  <span>{filteredInterviews.length}개 일정</span>
                </span>
              ) : (
                <span>{filteredInterviews.length}개 일정</span>
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

        {/* Schedule List - Scrollable */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {selectedDate 
                  ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정` 
                  : "전체 일정"
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredInterviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {selectedDate ? "선택한 날짜에 일정이 없습니다" : "등록된 면접 일정이 없습니다"}
                  </p>
                </div>
              ) : (
                filteredInterviews.map((interview) => {
                  const prepConfig = preparationConfig[interview.preparationStatus]
                  const PrepIcon = prepConfig.icon
                  const isUrgent = interview.dDay <= 3
                  const isEditing = editingScheduleFor === interview.id

                  return (
                    <div
                      key={interview.id}
                      className={cn(
                        "group relative rounded-xl border p-4 transition-all duration-300",
                        isEditing
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/50 bg-secondary/10 hover:bg-secondary/20"
                      )}
                    >
                      {/* Interview Info */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold text-foreground">
                              {interview.company}
                            </h4>
                            <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-xs">
                              {interview.stage}
                            </Badge>
                            <Badge variant="outline" className={cn("hidden sm:flex", prepConfig.className)}>
                              <PrepIcon className="mr-1 h-3 w-3" />
                              {prepConfig.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5" />
                              {interview.role}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {interview.date} {interview.time}
                            </span>
                          </div>
                        </div>

                        {/* Actions - Hide when editing */}
                        {!isEditing && (
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1.5 border-border/50 text-xs hover:bg-secondary"
                              onClick={() => handleEditClick(interview.id)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              수정
                            </Button>
                            <Button 
                              size="sm" 
                              className="gap-1.5 text-white hover:opacity-90"
                              style={{ backgroundColor: "#61A4BC" }}
                            >
                              <Play className="h-3.5 w-3.5" />
                              연습하기
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Inline Edit Form */}
                      {isEditing && (
                        <div className="mt-4 space-y-3 rounded-lg border border-primary/30 bg-card p-4">
                          <p className="text-sm font-medium text-foreground">일정 수정</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">날짜</Label>
                              <Input 
                                type="date" 
                                value={newSchedule.date}
                                onChange={(e) => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                                className="border-border/50 bg-secondary/30"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">시간</Label>
                              <Input 
                                type="time" 
                                value={newSchedule.time}
                                onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                                className="border-border/50 bg-secondary/30"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={handleCancelEdit}
                            >
                              취소
                            </Button>
                            <Button 
                              size="sm" 
                              className="text-white"
                              style={{ backgroundColor: "#61A4BC" }}
                              disabled={!newSchedule.date || !newSchedule.time}
                              onClick={handleSaveEdit}
                            >
                              저장
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
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
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

          <Tabs defaultValue="unscheduled" className="mt-4">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="unscheduled" className="text-xs">일정 미정</TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs">일정 확정</TabsTrigger>
            </TabsList>

            <TabsContent value="unscheduled" className="mt-4 space-y-3">
              {unscheduledInterviews.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/50 bg-secondary/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{item.company}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.role}</span>
                        <Badge variant="outline" className="border-border/50 text-[10px]">
                          {item.stage}
                        </Badge>
                      </div>
                    </div>
                    {settingScheduleFor !== item.id && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1.5 border-border/50 text-xs"
                        onClick={() => {
                          setSettingScheduleFor(item.id)
                          setNewSchedule({ date: "", time: "" })
                        }}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        일정 설정
                      </Button>
                    )}
                  </div>
                  
                  {/* Inline Date/Time Picker */}
                  {settingScheduleFor === item.id && (
                    <div className="mt-4 space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">날짜</Label>
                          <Input 
                            type="date" 
                            value={newSchedule.date}
                            onChange={(e) => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                            className="border-border/50 bg-secondary/30"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">시간</Label>
                          <Input 
                            type="time" 
                            value={newSchedule.time}
                            onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                            className="border-border/50 bg-secondary/30"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setSettingScheduleFor(null)}
                        >
                          취소
                        </Button>
                        <Button 
                          size="sm" 
                          className="text-white"
                          style={{ backgroundColor: "#61A4BC" }}
                          disabled={!newSchedule.date || !newSchedule.time}
                          onClick={() => {
                            if (settingScheduleFor && newSchedule.date && newSchedule.time) {
                              // 미정 일정을 확정 일정으로 변환
                              const unscheduledItem = unscheduledInterviews.find(i => i.id === settingScheduleFor)
                              if (unscheduledItem) {
                                // 날짜 파싱
                                const [year, month, day] = newSchedule.date.split('-').map(Number)
                                const calendarDate = new Date(year, month - 1, day)
                                const displayDate = `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
                                
                                // 새 일정 객체 생성
                                const newInterview: Interview = {
                                  id: settingScheduleFor,
                                  company: unscheduledItem.company,
                                  role: unscheduledItem.role,
                                  stage: unscheduledItem.stage,
                                  date: displayDate,
                                  time: newSchedule.time,
                                  dDay: Math.ceil((calendarDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
                                  preparationStatus: "notStarted",
                                  calendarDate: calendarDate
                                }
                                
                                // allInterviews에 추가
                                setAllInterviews([...allInterviews, newInterview])
                                
                                // unscheduledInterviews에서 제거
                                setUnscheduledInterviews(unscheduledInterviews.filter(i => i.id !== settingScheduleFor))
                                
                                // 상태 초기화 및 모달 닫기
                                setSettingScheduleFor(null)
                                setNewSchedule({ date: "", time: "" })
                                setIsAddModalOpen(false)
                              }
                            }
                          }}
                        >
                          확정
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {unscheduledInterviews.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  일정이 미정인 자기소개서가 없습니다.
                </p>
              )}
            </TabsContent>

            <TabsContent value="scheduled" className="mt-4 space-y-3">
              {allInterviews.slice(0, 3).map((interview) => {
                const isEditing = settingScheduleFor === `edit-${interview.id}`
                
                return (
                  <div
                    key={interview.id}
                    className="rounded-xl border border-border/50 bg-secondary/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{interview.company}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{interview.role}</span>
                          <span>{interview.date} {interview.time}</span>
                        </div>
                      </div>
                      {!isEditing && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1.5 border-border/50 text-xs"
                          onClick={() => {
                            setSettingScheduleFor(`edit-${interview.id}`)
                            const dateParts = interview.date.split('.')
                            const formattedDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`
                            setNewSchedule({ date: formattedDate, time: interview.time })
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          수정
                        </Button>
                      )}
                    </div>
                    
                    {/* Inline Date/Time Picker for Edit */}
                    {isEditing && (
                      <div className="mt-4 space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">날짜</Label>
                            <Input 
                              type="date" 
                              value={newSchedule.date}
                              onChange={(e) => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                              className="border-border/50 bg-secondary/30"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">시간</Label>
                            <Input 
                              type="time" 
                              value={newSchedule.time}
                              onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                              className="border-border/50 bg-secondary/30"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setSettingScheduleFor(null)}
                          >
                            취소
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-primary to-violet-600 text-white"
                            disabled={!newSchedule.date || !newSchedule.time}
                            onClick={() => {
                              setSettingScheduleFor(null)
                            }}
                          >
                            저장
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
