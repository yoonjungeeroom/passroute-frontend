"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
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
  AlertCircle,
  Clock,
  ChevronLeft,
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

import { getSessionQuestions, submitAnswer, endInterview } from "@/lib/api/interview"
import type { SessionQuestion, AnswerProgressResponse } from "@/types/interview"
import { useSTT } from "@/hooks/use-stt"
import { useFaceAnalysis } from "@/hooks/use-face-analysis"

// Pre-check Component
function PreCheckScreen({
  deviceStatus,
  stream,
  onRetest,
  onComplete,
}: {
  deviceStatus: DeviceStatus
  stream: MediaStream | null
  onRetest: () => void
  onComplete: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

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
        <div className="flex w-full max-w-3xl flex-col gap-6">
          {/* Top: Webcam Preview */}
          <div className="space-y-3">
            <div className="relative mx-auto aspect-video max-w-2xl overflow-hidden rounded-2xl border border-border/50 bg-secondary/50">
              {stream ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  {/* Face guide overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <svg width="180" height="240" viewBox="0 0 180 240" fill="none" className="opacity-60">
                      <ellipse cx="90" cy="95" rx="70" ry="85"
                        stroke={deviceStatus.faceDetected === "detected" ? "#22c55e" : "#ef4444"}
                        strokeWidth="2" strokeDasharray="8 4" fill="none" />
                      <path d="M20 240 Q20 190 90 180 Q160 190 160 240"
                        stroke={deviceStatus.faceDetected === "detected" ? "#22c55e" : "#ef4444"}
                        strokeWidth="2" strokeDasharray="8 4" fill="none" />
                    </svg>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="relative">
                    <div className="h-48 w-40 rounded-full border-2 border-dashed border-primary/50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 backdrop-blur-sm">
                <div className={cn("h-2 w-2 rounded-full", stream ? "animate-pulse bg-rose-500" : "bg-muted-foreground")} />
                <span className="text-xs font-medium text-foreground">{stream ? "LIVE" : "OFF"}</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {stream ? "얼굴을 중앙에 맞춰주세요" : "카메라 권한을 허용해주세요"}
            </p>
          </div>

          {/* Bottom: Status Panel */}
          <div className="space-y-4">
            {/* Status items in a row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statusItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/30 bg-card p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(item.status)}
                    <span
                      className={cn(
                        "text-xs font-medium",
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

            {/* Checklist Summary */}
            <div className="flex items-center justify-center gap-3 rounded-xl border border-border/30 bg-card p-4">
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
                    <p className="text-sm text-muted-foreground">카메라 앞에서 말씀해 주세요</p>
                  </div>
                </>
              )}
            </div>

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

// Analysis panel - unified light theme
function AnalysisPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="flex-1 p-3">{children}</div>
    </div>
  )
}

// Live Interview Component
function LiveInterviewScreen({
  mode,
  sessionId,
  questions,
  company,
  role,
  stage,
  onEnd,
  stream,
}: {
  mode: InterviewMode
  sessionId: number
  questions: SessionQuestion[]
  company?: string
  role?: string
  stage?: string
  onEnd: () => void
  stream: MediaStream | null
}) {
  const userVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (userVideoRef.current && stream) {
      userVideoRef.current.srcObject = stream
    }
  }, [stream])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>("waiting")
  const [answerTime, setAnswerTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [reAnswerCount, setReAnswerCount] = useState(0)
  const [followUpQuestion, setFollowUpQuestion] = useState<{ id: number; text: string } | null>(null)
  const [verbalScores, setVerbalScores] = useState({ structure: 0, logic: 0, specificity: 0, jobFit: 0 })

  const currentQuestion = followUpQuestion
    ? { questionId: followUpQuestion.id, questionText: followUpQuestion.text, questionOrder: -1 }
    : questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const questionTimeLimit = 210 // 3:30

  // STT hook
  const { transcript, wpm, fillerCount, audioLevel, feedback: sttFeedback } = useSTT({
    sessionId,
    questionId: currentQuestion?.questionId ?? 0,
    stream,
    active: answerState === "answering" && !isPaused,
  })
  const lastTranscriptRef = useRef("")
  useEffect(() => {
    if (transcript) lastTranscriptRef.current = transcript
  }, [transcript])

  // Face analysis hook - always active during interview
  const { gazeRatio, blinkCount, ear, faceDetected, feedback: faceFeedback } = useFaceAnalysis({
    sessionId,
    questionId: currentQuestion?.questionId ?? 0,
    videoRef: userVideoRef,
    active: !isPaused,
  })

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartAnswer = () => {
    if (mode === "real" && reAnswerCount > 0) return
    setAnswerState("answering")
    setAnswerTime(0)
    if (mode === "real") setReAnswerCount(reAnswerCount + 1)
  }

  const handleFinishAnswer = async () => {
    if (!currentQuestion) return
    setAnswerState("answered")
    try {
      const result: AnswerProgressResponse = await submitAnswer(sessionId, {
        questionId: currentQuestion.questionId,
        answerText: lastTranscriptRef.current || transcript,
        voiceData: wpm > 0 ? { filler_word_count: fillerCount, wpm } : undefined,
      })
      if (result.evaluation) {
        setVerbalScores({
          structure: result.evaluation.structure ?? 0,
          logic: result.evaluation.logic ?? 0,
          specificity: result.evaluation.specificity ?? 0,
          jobFit: result.evaluation.jobFit ?? 0,
        })
      }
      if (result.hasFollowUp && result.followUpQuestionId && result.followUpQuestionText) {
        setFollowUpQuestion({ id: result.followUpQuestionId, text: result.followUpQuestionText })
      } else {
        setFollowUpQuestion(null)
      }
    } catch {
      setFollowUpQuestion(null)
    }
  }

  const handleNextQuestion = async () => {
    if (followUpQuestion) {
      setFollowUpQuestion(null)
      setAnswerState("waiting")
      setAnswerTime(0)
      return
    }
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setAnswerState("waiting")
      setAnswerTime(0)
    } else {
      try {
        await endInterview(sessionId)
      } catch { /* ignore */ }
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

  // ear(Eye Aspect Ratio) 0.2~0.4 범위를 0~100으로 매핑 → 표정 자연스러움 근사
  const expressionScore = faceDetected ? Math.min(100, Math.round(Math.max(0, (ear - 0.15) / 0.25) * 100)) : 0
  const visionMetrics = [
    { label: "시선 안정성", value: Math.round(gazeRatio) },
    { label: "표정 자연스러움", value: expressionScore },
    { label: "자세 안정성", value: faceDetected ? Math.round(gazeRatio * 0.9) : 0 },
    { label: "깜빡임 횟수", value: blinkCount },
  ]

  const verbalMetrics = [
    { label: "답변 구조", value: verbalScores.structure },
    { label: "논리적 흐름", value: verbalScores.logic },
    { label: "구체성", value: verbalScores.specificity },
    { label: "직무 적합도", value: verbalScores.jobFit },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-border bg-white px-5 py-3">
        <div className="flex items-center gap-4">
          {company && <span className="font-semibold text-foreground">{company}</span>}
          {company && role && <div className="h-4 w-px bg-border" />}
          {role && <span className="text-sm text-muted-foreground">{role}</span>}
          {(company || role) && stage && <div className="h-4 w-px bg-border" />}
          {stage && <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">{stage}</span>}
        </div>
        <div className="flex items-center gap-3">
          {mode === "practice" && (
            <span className="text-xs font-medium text-muted-foreground">Q{currentQuestionIndex + 1}/{totalQuestions}</span>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm font-medium text-foreground">{formatTime(totalTime)}</span>
          </div>
          <button onClick={onEnd} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            <X className="h-4 w-4" />
            종료
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex flex-1 gap-3 overflow-hidden p-3">
        {/* Left Column: Vision Analysis */}
        {mode === "practice" && (
          <div className="hidden w-56 shrink-0 flex-col gap-3 xl:flex">
            <AnalysisPanel title="Vision Analysis">
              <div className="mb-4 flex justify-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-background">
                  {stream ? (
                    <video
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                      ref={(el) => { if (el && stream) el.srcObject = stream }}
                    />
                  ) : (
                    <User className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground/30" />
                  )}
                  <div className="absolute inset-1 rounded-md border border-dashed border-primary/30" />
                </div>
              </div>
              <div className="space-y-3">
                {visionMetrics.map((m) => (
                  <div key={m.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                      <span className="text-xs font-semibold text-foreground">{m.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </AnalysisPanel>
          </div>
        )}

        {/* Center Column: Video + Question */}
        <div className="flex flex-1 flex-col gap-3">
          {/* Video Area */}
          <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-white">
            <div className="grid h-full grid-cols-1 gap-3 p-3 lg:grid-cols-2">
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-background">
                {/* AI Avatar with voice visualization */}
                <div className="relative">
                  {/* Pulsing rings when speaking */}
                  {answerState === "waiting" && (
                    <>
                      <div className="absolute inset-0 m-auto h-24 w-24 animate-ping rounded-full border border-foreground/5" style={{ animationDuration: "2s" }} />
                      <div className="absolute inset-0 m-auto h-28 w-28 animate-ping rounded-full border border-foreground/3" style={{ animationDuration: "3s" }} />
                    </>
                  )}
                  <div className={cn(
                    "relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300",
                    answerState === "waiting" ? "border-foreground/20 bg-foreground/5" : "border-border bg-background"
                  )}>
                    <Headphones className="h-8 w-8 text-foreground/60" />
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">AI 면접관</p>

                {/* Voice waveform when AI is speaking */}
                {answerState === "waiting" && (
                  <div className="mt-3 flex items-center gap-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-foreground/40"
                        style={{
                          height: `${8 + Math.sin((i / 12) * Math.PI * 2 + Date.now() / 300) * 10}px`,
                          animation: "waveBar 0.8s ease-in-out infinite",
                          animationDelay: `${i * 60}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {answerState === "waiting" && (
                  <span className="mt-2 text-xs text-muted-foreground">질문을 읽고 있습니다...</span>
                )}
              </div>
              <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-background">
                {stream ? (
                  <video ref={userVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-muted-foreground/20" />
                )}
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                  <span className="text-xs font-medium text-foreground">REC</span>
                </div>
                {answerState === "answering" && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
                      <Mic className="h-4 w-4 text-primary" />
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all duration-100" style={{ width: `${audioLevel}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {(sttFeedback || faceFeedback) && (
              <div className="mx-3 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {sttFeedback || faceFeedback}
              </div>
            )}
          </div>

          {/* Question + Timer */}
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Q{followUpQuestion ? "+" : currentQuestionIndex + 1}
                  </span>
                  {followUpQuestion && (
                    <span className="rounded border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">꼬리 질문</span>
                  )}
                </div>
                <p className="text-base font-medium leading-relaxed text-foreground">
                  {mode === "practice" ? currentQuestion?.questionText ?? "질문을 불러오는 중..." : "질문이 재생되었습니다. 답변을 시작하세요."}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background px-4 py-2">
                <span className={cn("font-mono text-2xl font-bold", answerState === "answering" ? "text-primary" : "text-muted-foreground")}>
                  {formatTime(answerTime)}
                </span>
                <span className="font-mono text-xs text-muted-foreground">/ {formatTime(questionTimeLimit)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {answerState === "waiting" && <><div className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="text-sm text-muted-foreground">답변 대기 중</span></>}
                  {answerState === "answering" && <><div className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500" /><span className="text-sm text-foreground">답변 중</span></>}
                  {answerState === "answered" && <><CheckCircle2 className="h-4 w-4 text-success" /><span className="text-sm text-success">답변 완료</span></>}
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setIsPaused(!isPaused)}>
                  {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  {isPaused ? "재개" : "일시정지"}
                </Button>
                {mode === "practice" && answerState === "answered" && (
                  <>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={handleRetryAnswer}><RotateCcw className="h-3 w-3" />다시 답변</Button>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={handleSkipQuestion}><SkipForward className="h-3 w-3" />넘어가기</Button>
                  </>
                )}
              </div>
              <div>
                {answerState === "waiting" && (
                  <Button className="gap-1.5 bg-foreground text-background hover:bg-foreground/90" onClick={handleStartAnswer}>답변 시작<Mic className="h-4 w-4" /></Button>
                )}
                {answerState === "answering" && (
                  <Button className="gap-1.5 bg-foreground text-background hover:bg-foreground/90" onClick={handleFinishAnswer}>답변 완료<CheckCircle2 className="h-4 w-4" /></Button>
                )}
                {answerState === "answered" && (
                  <Button className="gap-1.5 bg-foreground text-background hover:bg-foreground/90" onClick={handleNextQuestion}>
                    {currentQuestionIndex < totalQuestions - 1 ? "다음 질문" : "면접 종료"}<ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verbal + Voice Analysis */}
        {mode === "practice" && (
          <div className="hidden w-56 shrink-0 flex-col gap-3 xl:flex">
            <AnalysisPanel title="Verbal Analysis">
              <div className="space-y-3">
                {verbalMetrics.map((m) => (
                  <div key={m.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                      <span className="text-xs font-semibold text-foreground">{m.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </AnalysisPanel>
            <AnalysisPanel title="Voice Analysis">
              <div className="space-y-3">
                <div className="flex h-10 items-end gap-0.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="w-1 rounded-full bg-primary transition-all duration-150"
                      style={{ height: `${answerState === "answering" ? (Math.sin((i / 24) * Math.PI) * 60 + 20 + Math.random() * 20) : 15}%`, opacity: answerState === "answering" ? 0.6 : 0.15 }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-background p-2 text-center">
                    <div className="text-lg font-bold text-foreground">{wpm > 0 ? Math.round(wpm) : "--"}</div>
                    <div className="text-[10px] text-muted-foreground">WPM</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-2 text-center">
                    <div className="text-lg font-bold text-foreground">{fillerCount > 0 ? fillerCount : "--"}</div>
                    <div className="text-[10px] text-muted-foreground">필러워드</div>
                  </div>
                </div>
              </div>
            </AnalysisPanel>
          </div>
        )}
      </main>
    </div>
  )
}

// Inner component that uses useSearchParams
function InterviewPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams?.get("mode") as InterviewMode | null
  const sessionIdParam = searchParams?.get("sessionId")
  const [state, setState] = useState<InterviewState>("precheck")
  const [mode] = useState<InterviewMode>(modeParam || "practice")
  const [questions, setQuestions] = useState<SessionQuestion[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: "checking",
    microphone: "checking",
    faceDetected: "checking",
    audioInput: "checking",
  })
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  // Real device check
  useEffect(() => {
    let cancelled = false
    let audioCtx: AudioContext | null = null

    async function checkDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        setMediaStream(stream)

        // Camera check
        const videoTrack = stream.getVideoTracks()[0]
        setDeviceStatus(prev => ({
          ...prev,
          camera: videoTrack ? "connected" : "error",
        }))

        // Microphone check
        const audioTrack = stream.getAudioTracks()[0]
        setDeviceStatus(prev => ({ ...prev, microphone: audioTrack ? "connected" : "error" }))

        // Face detection via canvas frame analysis
        if (videoTrack) {
          const video = document.createElement("video")
          video.srcObject = stream
          video.muted = true
          video.playsInline = true
          video.play()

          const canvas = document.createElement("canvas")
          canvas.width = 160
          canvas.height = 120
          const ctx = canvas.getContext("2d")!

          const checkFace = () => {
            if (cancelled) return
            if (video.readyState >= 2) {
              ctx.drawImage(video, 0, 0, 160, 120)
              const imageData = ctx.getImageData(40, 20, 80, 80) // center region
              const pixels = imageData.data
              let nonBlack = 0
              let skinTone = 0
              for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
                if (r > 30 || g > 30 || b > 30) nonBlack++
                // Rough skin tone detection
                if (r > 80 && g > 50 && b > 30 && r > g && (r - g) > 10) skinTone++
              }
              const totalPixels = pixels.length / 4
              if (nonBlack / totalPixels > 0.5 && skinTone / totalPixels > 0.1) {
                setDeviceStatus(prev => ({ ...prev, faceDetected: "detected" }))
              } else {
                setDeviceStatus(prev => ({ ...prev, faceDetected: "not-detected" }))
                requestAnimationFrame(checkFace)
              }
            } else {
              requestAnimationFrame(checkFace)
            }
          }
          checkFace()
        }

        // Audio input detection - waits for actual sound
        if (audioTrack) {
          audioCtx = new AudioContext()
          const source = audioCtx.createMediaStreamSource(stream)
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          const data = new Uint8Array(analyser.frequencyBinCount)

          const checkAudio = () => {
            if (cancelled) return
            analyser.getByteFrequencyData(data)
            const avg = data.reduce((a, b) => a + b, 0) / data.length
            if (avg > 5) {
              setDeviceStatus(prev => ({ ...prev, audioInput: "detected" }))
            } else {
              requestAnimationFrame(checkAudio)
            }
          }
          checkAudio()
        }
      } catch {
        if (cancelled) return
        setDeviceStatus({
          camera: "error",
          microphone: "error",
          faceDetected: "not-detected",
          audioInput: "not-detected",
        })
      }
    }

    checkDevices()
    return () => {
      cancelled = true
      audioCtx?.close()
    }
  }, [])

  // Load questions from API
  useEffect(() => {
    if (!sessionIdParam) return
    getSessionQuestions(Number(sessionIdParam))
      .then(setQuestions)
      .catch(() => setLoadError("질문을 불러오지 못했습니다."))
  }, [sessionIdParam])

  const handleRetest = () => {
    // 기존 스트림 정리
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop())
      setMediaStream(null)
    }
    setDeviceStatus({
      camera: "checking",
      microphone: "checking",
      faceDetected: "checking",
      audioInput: "checking",
    })

    // 재시도 - 실제 디바이스 체크를 다시 트리거
    // useEffect의 dependency를 이용할 수 없으므로 페이지를 리마운트
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setMediaStream(stream)
        const videoTrack = stream.getVideoTracks()[0]
        const audioTrack = stream.getAudioTracks()[0]
        setDeviceStatus(prev => ({
          ...prev,
          camera: videoTrack ? "connected" : "error",
          microphone: audioTrack ? "connected" : "error",
        }))

        // Face detection
        if (videoTrack) {
          const video = document.createElement("video")
          video.srcObject = stream
          video.muted = true
          video.playsInline = true
          video.play()
          const canvas = document.createElement("canvas")
          canvas.width = 160
          canvas.height = 120
          const ctx = canvas.getContext("2d")!
          const checkFace = () => {
            if (video.readyState >= 2) {
              ctx.drawImage(video, 0, 0, 160, 120)
              const imageData = ctx.getImageData(40, 20, 80, 80)
              const pixels = imageData.data
              let nonBlack = 0, skinTone = 0
              for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
                if (r > 30 || g > 30 || b > 30) nonBlack++
                if (r > 80 && g > 50 && b > 30 && r > g && (r - g) > 10) skinTone++
              }
              const total = pixels.length / 4
              setDeviceStatus(prev => ({
                ...prev,
                faceDetected: (nonBlack / total > 0.5 && skinTone / total > 0.1) ? "detected" : "not-detected",
              }))
            } else {
              requestAnimationFrame(checkFace)
            }
          }
          checkFace()
        }

        // Audio detection
        if (audioTrack) {
          const audioCtx = new AudioContext()
          const source = audioCtx.createMediaStreamSource(stream)
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          const data = new Uint8Array(analyser.frequencyBinCount)
          const checkAudio = () => {
            analyser.getByteFrequencyData(data)
            const avg = data.reduce((a, b) => a + b, 0) / data.length
            if (avg > 5) {
              setDeviceStatus(prev => ({ ...prev, audioInput: "detected" }))
              audioCtx.close()
            } else {
              requestAnimationFrame(checkAudio)
            }
          }
          checkAudio()
        }
      })
      .catch(() => {
        setDeviceStatus({
          camera: "error",
          microphone: "error",
          faceDetected: "not-detected",
          audioInput: "not-detected",
        })
      })
  }

  const handlePreCheckComplete = useCallback(() => {
    setState("countdown")
  }, [])

  const handleCountdownComplete = useCallback(() => {
    setState("interview")
  }, [])

  const handleInterviewEnd = () => {
    if (sessionIdParam) {
      router.push(`/reports/interview/${sessionIdParam}`)
    } else {
      router.push("/reports")
    }
  }

  if (!sessionIdParam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-foreground">세션 정보가 없습니다</p>
          <p className="mt-2 text-sm text-muted-foreground">대시보드에서 면접을 시작해 주세요.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>대시보드로 이동</Button>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 text-lg font-medium text-foreground">{loadError}</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>대시보드로 이동</Button>
        </div>
      </div>
    )
  }

  if (state === "precheck") {
    return (
      <PreCheckScreen
        deviceStatus={deviceStatus}
        stream={mediaStream}
        onRetest={handleRetest}
        onComplete={handlePreCheckComplete}
      />
    )
  }

  if (state === "countdown") {
    return <CountdownScreen onComplete={handleCountdownComplete} />
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">질문을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <LiveInterviewScreen
      mode={mode}
      sessionId={Number(sessionIdParam)}
      questions={questions}
      company={searchParams?.get("company") || undefined}
      role={searchParams?.get("role") || undefined}
      stage={searchParams?.get("stage") || undefined}
      onEnd={handleInterviewEnd}
      stream={mediaStream}
    />
  )
}

// Main Page Component
export default function InterviewPage() {
  return (
    <Suspense>
      <InterviewPageInner />
    </Suspense>
  )
}
