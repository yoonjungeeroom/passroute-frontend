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

const PRECHECK_PHRASE = "안녕하세요. 면접을 시작하겠습니다."
const RECORDING_DURATION = 6000 // ms

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
  const videoElRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [phase, setPhase] = useState<"ready" | "recording" | "result">("ready")
  const [progress, setProgress] = useState(0)
  const [faceOk, setFaceOk] = useState<boolean | null>(null)
  const [voiceOk, setVoiceOk] = useState<boolean | null>(null)

  const deviceReady =
    deviceStatus.camera === "connected" && deviceStatus.microphone === "connected"

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el
    if (el && stream) {
      el.srcObject = stream
    }
  }, [stream])

  const startRecording = useCallback(async () => {
    if (!stream) return
    setPhase("recording")
    setProgress(0)

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
      canvasRef.current.width = 160
      canvasRef.current.height = 120
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!

    let faceFrames = 0
    let totalFrames = 0
    let lastFaceCheck = 0
    let sttGotText = false
    let sttAccumText = ""

    const aiServerUrl = process.env.NEXT_PUBLIC_AI_WS_URL
    let audioCtx: AudioContext | null = null
    let ws: WebSocket | null = null

    try {
      audioCtx = new AudioContext({ sampleRate: 48000 })
      await audioCtx.audioWorklet.addModule("/audio-worklet-processor.js")
      const source = audioCtx.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(audioCtx, "pcm-processor", {
        processorOptions: { sampleRate: audioCtx.sampleRate },
      })
      source.connect(workletNode)
      workletNode.connect(audioCtx.destination)

      ws = new WebSocket(`${aiServerUrl}/ws/stt/1/1`)
      ws.onopen = () => {
        workletNode.port.onmessage = (e: MessageEvent) => {
          if (ws?.readyState === WebSocket.OPEN) ws.send(e.data as ArrayBuffer)
        }
      }
      ws.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data as string)
          if (data.status === "completed" && data.text) {
            sttAccumText += data.text as string
            const keywords = ["안녕", "면접", "시작"]
            if (keywords.every(k => sttAccumText.includes(k))) sttGotText = true
          }
        } catch { /* ignore */ }
      }
    } catch { /* AudioWorklet or WebSocket 실패 시 무시 */ }

    const startTime = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min(100, (elapsed / RECORDING_DURATION) * 100))

      if (elapsed - lastFaceCheck > 300) {
        lastFaceCheck = elapsed
        const video = videoElRef.current
        if (video && video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, 160, 120)
          const imageData = ctx.getImageData(30, 10, 100, 100)
          const pixels = imageData.data
          let skinTone = 0
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
            if (r > 80 && g > 50 && b > 30 && r > g && (r - g) > 15) skinTone++
          }
          totalFrames++
          if (skinTone / (pixels.length / 4) > 0.08) faceFrames++
        }
      }

      if (elapsed < RECORDING_DURATION) {
        requestAnimationFrame(tick)
      } else {
        ws?.close()
        audioCtx?.close()
        setFaceOk(totalFrames > 0 && faceFrames / totalFrames > 0.5)
        setVoiceOk(sttGotText)
        setPhase("result")
      }
    }

    requestAnimationFrame(tick)
  }, [stream])

  const bothPassed = faceOk === true && voiceOk === true

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
          대시보드로 돌아가기
        </Button>
        <h1 className="text-lg font-semibold text-foreground">면접 사전 점검</h1>
        <div className="w-[140px]" />
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-xl flex-col items-center gap-6">

          {/* 타이틀 */}
          <div className="text-center">
            {phase === "ready" && <>
              <p className="text-lg font-semibold text-foreground">카메라 가이드에 얼굴을 맞추고</p>
              <p className="text-lg font-semibold text-foreground">아래 문구를 소리 내어 읽어주세요</p>
            </>}
            {phase === "recording" && <p className="text-lg font-semibold text-foreground">문구를 소리 내어 읽어주세요</p>}
            {phase === "result" && <p className="text-xl font-bold text-foreground">
              {bothPassed ? "얼굴과 음성이 정상 인식되었어요!" : "인식에 실패한 항목이 있어요"}
            </p>}
          </div>

          {/* 카메라 - 항상 마운트 유지 */}
          <div className={cn(
            "relative w-full max-w-md overflow-hidden rounded-2xl bg-secondary/50",
            phase === "recording" ? "border-2 border-rose-400" : "border border-border/50"
          )} style={{ aspectRatio: "4/3" }}>
            {stream ? (
              <>
                <video ref={setVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-36 rounded-2xl border-2 border-dashed border-emerald-400/70" />
                </div>
                {phase === "recording" && (
                  <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-rose-500/90 px-3 py-1">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    <span className="text-xs font-medium text-white">REC</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <User className="h-20 w-20 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* 진행바 (recording) */}
          {phase === "recording" && (
            <div className="w-full space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-sm text-muted-foreground">분석 중...</p>
            </div>
          )}

          {/* 결과 (result) */}
          {phase === "result" && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className={cn("flex items-center justify-center gap-2 rounded-xl border p-4",
                faceOk ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50")}>
                {faceOk ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
                <span className={cn("text-sm font-medium", faceOk ? "text-emerald-700" : "text-rose-700")}>
                  얼굴 인식 {faceOk ? "성공" : "실패"}
                </span>
              </div>
              <div className={cn("flex items-center justify-center gap-2 rounded-xl border p-4",
                voiceOk ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50")}>
                {voiceOk ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
                <span className={cn("text-sm font-medium", voiceOk ? "text-emerald-700" : "text-rose-700")}>
                  음성 인식 {voiceOk ? "성공" : "실패"}
                </span>
              </div>
            </div>
          )}

          {/* 문구 + 버튼 영역 */}
          <div className="w-full rounded-xl border border-border bg-muted/30 px-6 py-4 text-center">
            <p className="text-base font-medium text-foreground">"{PRECHECK_PHRASE}"</p>
          </div>

          {phase === "ready" && (
            <div className="grid grid-cols-2 gap-3 w-full text-xs">
              <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2",
                deviceStatus.camera === "connected" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground")}>
                {deviceStatus.camera === "connected" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 animate-pulse rounded-full bg-muted-foreground/40" />}
                카메라 {deviceStatus.camera === "connected" ? "연결됨" : "확인 중..."}
              </div>
              <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2",
                deviceStatus.microphone === "connected" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground")}>
                {deviceStatus.microphone === "connected" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 animate-pulse rounded-full bg-muted-foreground/40" />}
                마이크 {deviceStatus.microphone === "connected" ? "연결됨" : "확인 중..."}
              </div>
            </div>
          )}

          {phase === "result" && !bothPassed && (
            <p className="text-sm text-muted-foreground text-center">
              {!faceOk && "카메라 가이드 안에 얼굴을 맞춰주세요. "}
              {!voiceOk && "조금 더 크게 말씀해 주세요."}
            </p>
          )}

          <div className="flex w-full gap-3">
            {phase === "ready" && <>
              <Button variant="outline" className="flex-1 gap-1.5" onClick={onRetest}>
                <RotateCcw className="h-4 w-4" />
                다시 시도
              </Button>
              <Button className="flex-1 gap-1.5" disabled={!deviceReady} onClick={startRecording}>
                <Mic className="h-4 w-4" />
                녹화 시작
              </Button>
            </>}
            {phase === "result" && <>
              <Button variant="outline" className="flex-1 gap-1.5" onClick={() => { setPhase("ready"); setFaceOk(null); setVoiceOk(null); setProgress(0) }}>
                <RotateCcw className="h-4 w-4" />
                다시 하기
              </Button>
              <Button className="flex-1 gap-1.5" disabled={!bothPassed} onClick={onComplete}>
                확인 완료
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>}
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

  const currentQuestion = followUpQuestion
    ? { questionId: followUpQuestion.id, questionText: followUpQuestion.text, questionOrder: -1 }
    : questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const questionTimeLimit = 210 // 3:30

  // STT hook
  const { transcript, wpm, fillerCount, totalFillerCount, silenceSec, audioLevel, feedback: sttFeedback } = useSTT({
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
  const { gazeRatio, blinkCount, gazeOffCount, ear, faceDetected, feedback: faceFeedback } = useFaceAnalysis({
    sessionId,
    questionId: currentQuestion?.questionId ?? 0,
    videoRef: userVideoRef,
    active: answerState === "answering" && !isPaused,
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
        {/* Left Column: 통합 분석 패널 — 실전 모드는 종료 후 리포트에서만 확인 */}
        {mode === "practice" && (
          <div className="hidden w-56 shrink-0 flex-col gap-3 xl:flex">
            <AnalysisPanel title="실시간 분석">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">음성</div>
              <div className="mb-3 grid grid-cols-3 gap-1.5">
                <div className="rounded-lg border border-border bg-background p-1.5 text-center">
                  <div className="text-sm font-bold text-foreground">{wpm > 0 ? Math.round(wpm) : "--"}</div>
                  <div className="text-[9px] text-muted-foreground">WPM</div>
                </div>
                <div className="rounded-lg border border-border bg-background p-1.5 text-center">
                  <div className="text-sm font-bold text-foreground">{silenceSec > 0 ? silenceSec.toFixed(1) : "--"}</div>
                  <div className="text-[9px] text-muted-foreground">침묵(초)</div>
                </div>
                <div className="rounded-lg border border-border bg-background p-1.5 text-center">
                  <div className="text-sm font-bold text-foreground">{totalFillerCount > 0 ? totalFillerCount : "--"}</div>
                  <div className="text-[9px] text-muted-foreground">필러워드</div>
                </div>
              </div>

              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">영상</div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">시선 고정률</span>
                    <span className="text-xs font-semibold text-foreground">{Math.round(gazeRatio)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${gazeRatio}%` }} />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-background p-1.5 text-center">
                  <div className="text-sm font-bold text-foreground">{gazeOffCount}</div>
                  <div className="text-[9px] text-muted-foreground">시선이탈</div>
                </div>
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
                {mode === "practice" && (sttFeedback || faceFeedback) && (
                  <div className="absolute left-3 right-3 top-12 z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 rounded-lg bg-amber-500/90 px-3 py-2 shadow backdrop-blur-sm">
                      <AlertCircle className="h-4 w-4 shrink-0 text-white" />
                      <span className="text-xs font-medium text-white">{sttFeedback || faceFeedback}</span>
                    </div>
                  </div>
                )}
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
                <span className={cn("font-mono text-2xl font-bold", answerState === "answering" ? (questionTimeLimit - answerTime <= 30 ? "text-destructive" : "text-primary") : "text-muted-foreground")}>
                  {formatTime(Math.max(0, questionTimeLimit - answerTime))}
                </span>
                <span className="font-mono text-xs text-muted-foreground">남은 시간</span>
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
