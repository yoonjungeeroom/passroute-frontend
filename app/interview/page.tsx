"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Camera,
  Mic,
  User,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Pause,
  Play,
  SkipForward,
  X,
  RefreshCw,
  Eye,
  Zap,
  AlertCircle,
  Building2,
  Briefcase,
  Clock,
  MessageSquare,
  ChevronLeft,
  CircleDot,
  Headphones,
} from "lucide-react"

// Types
type InterviewState = "precheck" | "countdown" | "interview"
type InterviewMode = "practice" | "real"
type AnswerState = "waiting" | "answering" | "answered"

interface DeviceStatus {
  camera: "checking" | "connected" | "error"
  microphone: "checking" | "connected" | "error"
  faceDetected: "checking" | "detected" | "not-detected"
  audioInput: "checking" | "detected" | "not-detected"
}

interface Question {
  id: number
  text: string
  isFollowUp?: boolean
  category: string
}

// Mock data
const mockQuestions: Question[] = [
  { id: 1, text: "본인 소개와 지원 동기에 대해 말씀해 주세요.", category: "인성" },
  { id: 2, text: "이전 프로젝트에서 가장 어려웠던 기술적 문제와 해결 방법을 설명해 주세요.", category: "직무" },
  { id: 3, text: "그 해결 방법을 선택한 구체적인 이유가 있나요?", isFollowUp: true, category: "직무" },
  { id: 4, text: "팀 협업 시 의견 충돌이 있었던 경험과 어떻게 해결했는지 말씀해 주세요.", category: "인성" },
  { id: 5, text: "5년 후 본인의 커리어 목표는 무엇인가요?", category: "인성" },
]

// Pre-check Component
function PreCheckScreen({
  deviceStatus,
  onRetest,
  onComplete,
}: {
  deviceStatus: DeviceStatus
  onRetest: () => void
  onComplete: () => void
}) {
  const allPassed =
    deviceStatus.camera === "connected" &&
    deviceStatus.microphone === "connected" &&
    deviceStatus.faceDetected === "detected" &&
    deviceStatus.audioInput === "detected"

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "detected":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case "error":
      case "not-detected":
        return <XCircle className="h-4 w-4 text-rose-400" />
      default:
        return <div className="h-4 w-4 animate-pulse rounded-full bg-muted-foreground/50" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
      case "detected":
        return "정상"
      case "error":
      case "not-detected":
        return "미연결"
      default:
        return "확인 중..."
    }
  }

  const statusItems = [
    { icon: Camera, label: "카메라 연결 상태", status: deviceStatus.camera },
    { icon: Mic, label: "마이크 연결 상태", status: deviceStatus.microphone },
    { icon: User, label: "얼굴 인식 여부", status: deviceStatus.faceDetected },
    { icon: Volume2, label: "음성 입력 감지", status: deviceStatus.audioInput },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
          대시보드로 돌아가기
        </Button>
        <h1 className="text-lg font-semibold text-foreground">면접 사전 점검</h1>
        <div className="w-[140px]" />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
          {/* Left: Webcam Preview */}
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/50 bg-secondary/50">
              {/* Simulated webcam view */}
              <div className="flex h-full items-center justify-center">
                <div className="relative">
                  {/* Face alignment guide */}
                  <div className="h-48 w-40 rounded-full border-2 border-dashed border-primary/50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                </div>
              </div>
              {/* Recording indicator */}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                <span className="text-xs font-medium text-foreground">LIVE</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              얼굴을 중앙에 맞춰주세요
            </p>
          </div>

          {/* Right: Status Panel */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6">
                <h2 className="mb-4 text-base font-semibold text-foreground">시스템 상태</h2>
                <div className="space-y-3">
                  {statusItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-border/30 bg-secondary/30 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span
                          className={cn(
                            "text-sm font-medium",
                            item.status === "connected" || item.status === "detected"
                              ? "text-emerald-400"
                              : item.status === "error" || item.status === "not-detected"
                              ? "text-rose-400"
                              : "text-muted-foreground"
                          )}
                        >
                          {getStatusText(item.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Checklist Summary */}
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  {allPassed ? (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">모든 점검이 완료되었습니다</p>
                        <p className="text-sm text-muted-foreground">면접을 시작할 준비가 되었어요</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                        <AlertCircle className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">점검이 진행 중입니다</p>
                        <p className="text-sm text-muted-foreground">잠시만 기다려 주세요</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-1.5 border-border/50" onClick={onRetest}>
                <RotateCcw className="h-4 w-4" />
                다시 테스트
              </Button>
              <Button
                className="flex-1 gap-1.5 text-white hover:opacity-90"
                style={{ backgroundColor: "#61A4BC" }}
                disabled={!allPassed}
                onClick={onComplete}
              >
                테스트 완료
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Countdown Component
function CountdownScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count === 0) {
      onComplete()
      return
    }
    const timer = setTimeout(() => setCount(count - 1), 1000)
    return () => clearTimeout(timer)
  }, [count, onComplete])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background/95">
      {/* Top text */}
      <p className="mb-8 text-lg text-muted-foreground">면접이 곧 시작됩니다</p>

      {/* Countdown number */}
      <div className="relative">
        <div
          key={count}
          className="flex h-48 w-48 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 animate-in zoom-in-50 duration-500"
        >
          <span className="text-8xl font-bold text-primary">{count}</span>
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary/20" />
      </div>

      {/* Helper text */}
      <p className="mt-8 text-sm text-muted-foreground">카메라와 마이크가 활성화되어 있습니다</p>
    </div>
  )
}

// Live Interview Component
function LiveInterviewScreen({
  mode,
  onEnd,
}: {
  mode: InterviewMode
  onEnd: () => void
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>("waiting")
  const [answerTime, setAnswerTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [reAnswerCount, setReAnswerCount] = useState(0) // Track re-answer attempts for real mode

  const currentQuestion = mockQuestions[currentQuestionIndex]
  const totalQuestions = mockQuestions.length

  // Timer effects
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setTotalTime((prev) => prev + 1)
      if (answerState === "answering") {
        setAnswerTime((prev) => prev + 1)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [isPaused, answerState])

  // Simulate audio level
  useEffect(() => {
    if (answerState !== "answering" || isPaused) {
      setAudioLevel(0)
      return
    }
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100)
    }, 100)
    return () => clearInterval(interval)
  }, [answerState, isPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartAnswer = () => {
    // In real mode, prevent re-answering after first attempt
    if (mode === "real" && reAnswerCount > 0) {
      return
    }
    setAnswerState("answering")
    setAnswerTime(0)
    if (mode === "real") {
      setReAnswerCount(reAnswerCount + 1)
    }
  }

  const handleFinishAnswer = () => {
    setAnswerState("answered")
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setAnswerState("waiting")
      setAnswerTime(0)
    } else {
      onEnd()
    }
  }

  const handleRetryAnswer = () => {
    setAnswerState("waiting")
    setAnswerTime(0)
  }

  const handleSkipQuestion = () => {
    handleNextQuestion()
  }

  // Real-time feedback (Practice mode only)
  const feedbackItems = [
    { label: "시선 안정성", value: 85, icon: Eye },
    { label: "말 속도", value: 72, icon: Zap },
    { label: "필러워드", value: 3, icon: MessageSquare, unit: "회" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">카카오</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">AI 엔지니어</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <Badge variant="secondary" className="text-xs">
            기술 면접
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {mode === "practice" && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              {currentQuestionIndex + 1} / {totalQuestions}
            </Badge>
          )}
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm font-medium text-foreground">{formatTime(totalTime)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Video Section */}
        <div className="flex flex-1 flex-col gap-4 p-6 lg:flex-row">
          {/* AI Interviewer */}
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-border/50 bg-secondary/30">
            <div className="flex h-full min-h-[240px] items-center justify-center lg:min-h-0">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20">
                  <Headphones className="h-12 w-12 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">AI 면접관</p>
              </div>
            </div>
            {/* Speaking indicator */}
            {answerState === "waiting" && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1.5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-1 animate-pulse rounded-full bg-primary"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-primary">질문 중</span>
              </div>
            )}
          </div>

          {/* User Webcam */}
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-border/50 bg-secondary/30">
            <div className="flex h-full min-h-[240px] items-center justify-center lg:min-h-0">
              <User className="h-16 w-16 text-muted-foreground/30" />
            </div>
            {/* Recording indicator */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur-sm">
              <CircleDot className="h-3 w-3 text-rose-500" />
              <span className="text-xs font-medium text-foreground">REC</span>
            </div>
            {/* Audio level indicator */}
            {answerState === "answering" && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 rounded-lg bg-background/80 px-3 py-2 backdrop-blur-sm">
                  <Mic className="h-4 w-4 text-primary" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-100"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Panel - Practice Mode Only */}
        {mode === "practice" && (
          <div className="w-full border-t border-border/50 p-4 lg:w-72 lg:border-l lg:border-t-0">
            <h3 className="mb-3 text-sm font-semibold text-foreground">실시간 피드백</h3>
            <div className="space-y-3">
              {feedbackItems.map((item, index) => (
                <div key={index} className="rounded-xl border border-border/30 bg-secondary/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {item.value}{item.unit || "%"}
                    </span>
                  </div>
                  {!item.unit && (
                    <Progress value={item.value} className="h-1.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Section */}
      <footer className="border-t border-border/50 p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Question Card */}
          <Card className="border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {currentQuestion.category}
                </Badge>
                {currentQuestion.isFollowUp && (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
                    꼬리 질문
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  다시 듣기
                </Button>
              </div>
              {mode === "practice" && (
                <p className="text-lg font-medium leading-relaxed text-foreground">
                  {currentQuestion.text}
                </p>
              )}
              {mode === "real" && (
                <p className="text-lg font-medium leading-relaxed text-muted-foreground">
                  질문이 재생되었습니다. 답변을 시작하세요.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Answer Area */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4">
            <div className="flex items-center gap-4">
              {/* Answer State Indicator */}
              <div className="flex items-center gap-2">
                {answerState === "waiting" && (
                  <>
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="text-sm text-muted-foreground">답변 대기 중</span>
                  </>
                )}
                {answerState === "answering" && (
                  <>
                    <div className="h-3 w-3 animate-pulse rounded-full bg-rose-500" />
                    <span className="text-sm text-foreground">답변 중</span>
                  </>
                )}
                {answerState === "answered" && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">답변 완료</span>
                  </>
                )}
              </div>

              {/* Answer Timer */}
              {(answerState === "answering" || answerState === "answered") && (
                <div className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-sm text-foreground">{formatTime(answerTime)}</span>
                </div>
              )}
            </div>

            {/* Sub-actions (Practice mode) */}
            {mode === "practice" && answerState === "answered" && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={handleRetryAnswer}>
                  <RotateCcw className="h-3 w-3" />
                  다시 답변
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={handleSkipQuestion}>
                  <SkipForward className="h-3 w-3" />
                  넘어가기
                </Button>
              </div>
            )}
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-border/50"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? "재개" : "일시정지"}
              </Button>
              {mode === "real" && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  다시 질문
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                onClick={onEnd}
              >
                <X className="h-4 w-4" />
                종료
              </Button>
              {answerState === "waiting" && (
                <Button
                  className="gap-1.5 text-white hover:opacity-90"
                  style={{ backgroundColor: "#61A4BC" }}
                  onClick={handleStartAnswer}
                >
                  답변 시작
                  <Mic className="h-4 w-4" />
                </Button>
              )}
              {answerState === "answering" && (
                <Button
                  className="gap-1.5 text-white hover:opacity-90"
                  style={{ backgroundColor: "#61A4BC" }}
                  onClick={handleFinishAnswer}
                >
                  답변 완료
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              {answerState === "answered" && mode === "practice" && (
                <Button
                  className="gap-1.5 text-white hover:opacity-90"
                  style={{ backgroundColor: "#61A4BC" }}
                  onClick={handleNextQuestion}
                >
                  {currentQuestionIndex < totalQuestions - 1 ? "다음 질문" : "면접 종료"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              {answerState === "answered" && mode === "real" && (
                <Button
                  className="gap-1.5 text-white hover:opacity-90"
                  style={{ backgroundColor: "#61A4BC" }}
                  onClick={handleNextQuestion}
                >
                  {currentQuestionIndex < totalQuestions - 1 ? "다음 질문" : "면접 종료"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Inner component that uses useSearchParams
function InterviewPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams?.get("mode") as InterviewMode | null
  const [state, setState] = useState<InterviewState>("precheck")
  const [mode] = useState<InterviewMode>(modeParam || "practice")
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: "checking",
    microphone: "checking",
    faceDetected: "checking",
    audioInput: "checking",
  })

  // Simulate device check
  useEffect(() => {
    const timers = [
      setTimeout(() => setDeviceStatus((prev) => ({ ...prev, camera: "connected" })), 1000),
      setTimeout(() => setDeviceStatus((prev) => ({ ...prev, microphone: "connected" })), 1500),
      setTimeout(() => setDeviceStatus((prev) => ({ ...prev, faceDetected: "detected" })), 2000),
      setTimeout(() => setDeviceStatus((prev) => ({ ...prev, audioInput: "detected" })), 2500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const handleRetest = () => {
    setDeviceStatus({
      camera: "checking",
      microphone: "checking",
      faceDetected: "checking",
      audioInput: "checking",
    })
    const timers = [
      setTimeout(() => setDeviceStatus((prev) => ({ ...prev, camera: "connected" })), 1000),
      setTimeout(() => setDeviceStatus((prev) => ({ ...prev, microphone: "connected" })), 1500),
      setTimeout(() => setDeviceStatus((prev) => ({ ...prev, faceDetected: "detected" })), 2000),
      setTimeout(() => setDeviceStatus((prev) => ({ ...prev, audioInput: "detected" })), 2500),
    ]
  }

  const handlePreCheckComplete = useCallback(() => {
    setState("countdown")
  }, [])

  const handleCountdownComplete = useCallback(() => {
    setState("interview")
  }, [])

  const handleInterviewEnd = () => {
    router.push("/reports")
  }

  if (state === "precheck") {
    return (
      <PreCheckScreen
        deviceStatus={deviceStatus}
        onRetest={handleRetest}
        onComplete={handlePreCheckComplete}
      />
    )
  }

  if (state === "countdown") {
    return <CountdownScreen onComplete={handleCountdownComplete} />
  }

  return <LiveInterviewScreen mode={mode} onEnd={handleInterviewEnd} />
}

// Main Page Component
export default function InterviewPage() {
  return (
    <Suspense>
      <InterviewPageInner />
    </Suspense>
  )
}
