"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Users,
  Target,
  Swords,
  Trophy,
  Mic,
  MicOff,
  Camera,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  AlertCircle,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DeviceStatus {
  camera: "checking" | "connected" | "error"
  microphone: "checking" | "connected" | "error"
  faceDetected: "checking" | "detected" | "not-detected"
  audioInput: "checking" | "detected" | "not-detected"
}
import {
  getDebateTopics,
  getDebatePersonas,
  createDebateSession,
  startDebateSession,
  getDebateState,
  submitDebateTurn,
  endDebateSession,
  type DebateTopic,
  type DebatePersona,
  type DebateStateResponse,
  type DebateRound,
} from "@/lib/api/debate"
import { useDebateSTT } from "@/hooks/use-debate-stt"

const STATE_TO_ROUND: Record<string, DebateRound> = {
  OPENING_USER: "OPENING",
  REBUTTAL_1_USER: "REBUTTAL_1",
  REBUTTAL_2_USER: "REBUTTAL_2",
  CLOSING_USER: "CLOSING",
}

const roundLabel: Record<DebateRound, string> = {
  OPENING: "개회",
  REBUTTAL_1: "반론1",
  REBUTTAL_2: "반론2",
  CLOSING: "마무리",
  MODERATION: "사회",
}

type Phase = "precheck" | "setup" | "debating" | "ending"
type SetupStep = 1 | 2 | 3 | 4

export default function DebatePage() {
  const router = useRouter()

  // Pre-check state
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: "checking",
    microphone: "checking",
    faceDetected: "checking",
    audioInput: "checking",
  })
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const preCheckVideoRef = useRef<HTMLVideoElement>(null)
  const debateVideoRef = useRef<HTMLVideoElement>(null)

  // Setup state
  const [phase, setPhase] = useState<Phase>("precheck")
  const [setupStep, setSetupStep] = useState<SetupStep>(1)
  const [topics, setTopics] = useState<DebateTopic[]>([])
  const [personas, setPersonas] = useState<DebatePersona[]>([])
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null)
  const [selectedStance, setSelectedStance] = useState<"PRO" | "CON" | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<DebatePersona | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<"EASY" | "NORMAL" | "HARD">("NORMAL")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Debate state
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [debateState, setDebateState] = useState<DebateStateResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [polling, setPolling] = useState(false)
  const [pollTrigger, setPollTrigger] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playedTurnIds = useRef<Set<number>>(new Set())

  // STT
  const [recording, setRecording] = useState(false)
  const [sttReady, setSttReady] = useState(false)
  const currentRound = debateState?.currentState
    ? (STATE_TO_ROUND[debateState.currentState] ?? null)
    : null
  const { transcript: sttTranscript, audioLevel: sttAudioLevel, feedback: sttFeedback } =
    useDebateSTT({ sessionId, round: currentRound, stream: mediaStream, active: recording })

  // Load topics and personas
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [t, p] = await Promise.all([getDebateTopics(), getDebatePersonas()])
        setTopics(t)
        setPersonas(p)
      } catch {
        setTopics([])
        setPersonas([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Poll debate state with adaptive interval
  const [pollTimeout, setPollTimeout] = useState(false)
  useEffect(() => {
    if (phase !== "debating" || !sessionId) return
    let cancelled = false
    let waitStart = 0

    async function poll() {
      if (cancelled) return
      setPolling(true)
      try {
        const state = await getDebateState(sessionId!)
        if (cancelled) return
        setDebateState(state)
        if (state.currentState === "FINISHED") {
          setPhase("ending")
          return
        }
        if (state.waitingForUser) {
          // 사용자 턴이면 폴링 중단
          setPolling(false)
          waitStart = 0
          setPollTimeout(false)
          return
        }
        // AI 응답 대기 중 — 경과 시간에 따라 간격 조정
        if (waitStart === 0) waitStart = Date.now()
        const elapsed = Date.now() - waitStart
        if (elapsed >= 180_000) {
          setPollTimeout(true)
        }
        const delay = elapsed >= 30_000 ? 5000 : 1500
        setTimeout(poll, delay)
      } catch {
        if (!cancelled) setTimeout(poll, 5000)
      } finally {
        if (!cancelled) setPolling(false)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [phase, sessionId, pollTrigger])

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [debateState?.latestTurns])

  // 세션 변경 및 언마운트 시 오디오 정지 + 재생 기록 초기화
  useEffect(() => {
    playedTurnIds.current.clear()
    return () => {
      audioRef.current?.pause()
    }
  }, [sessionId])

  // TTS 자동 재생 — audioUrl 있는 새 AI 턴만
  useEffect(() => {
    if (!debateState?.latestTurns) return
    const newAudioTurn = [...debateState.latestTurns]
      .reverse()
      .find(
        (t) =>
          t.speakerType !== "USER" &&
          t.audioUrl &&
          !playedTurnIds.current.has(t.id)
      )
    if (!newAudioTurn || !newAudioTurn.audioUrl) return
    playedTurnIds.current.add(newAudioTurn.id)
    audioRef.current?.pause()
    audioRef.current = new Audio(newAudioTurn.audioUrl)
    audioRef.current.play().catch(() => {})
  }, [debateState?.latestTurns])

  const filteredTopics = categoryFilter === "all"
    ? topics
    : topics.filter(t => t.category === categoryFilter)

  const categories = [...new Set(topics.map(t => t.category))]

  const canProceed = () => {
    switch (setupStep) {
      case 1: return !!selectedTopic
      case 2: return !!selectedStance
      case 3: return !!selectedPersona
      case 4: return true
      default: return false
    }
  }

  const handleCreateSession = async () => {
    if (!selectedTopic || !selectedStance || !selectedPersona) return
    setCreating(true)
    try {
      const { sessionId: sid } = await createDebateSession({
        topicId: selectedTopic.id,
        userStance: selectedStance,
        personaId: selectedPersona.id,
        difficulty: selectedDifficulty,
      })
      setSessionId(sid)
      await startDebateSession(sid)
      setPhase("debating")
    } catch {
      // 세션 생성 실패
    } finally {
      setCreating(false)
    }
  }

  // 사전점검 — 카메라+마이크 획득 및 디바이스 체크
  useEffect(() => {
    if (phase !== "precheck") return
    let cancelled = false
    let audioCtx: AudioContext | null = null

    async function checkDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        setMediaStream(stream)

        const videoTrack = stream.getVideoTracks()[0]
        setDeviceStatus(prev => ({ ...prev, camera: videoTrack ? "connected" : "error" }))

        const audioTrack = stream.getAudioTracks()[0]
        setDeviceStatus(prev => ({ ...prev, microphone: audioTrack ? "connected" : "error" }))

        // 얼굴 인식
        if (videoTrack) {
          const video = document.createElement("video")
          video.srcObject = stream
          video.muted = true
          video.playsInline = true
          video.play()
          const canvas = document.createElement("canvas")
          canvas.width = 160; canvas.height = 120
          const ctx = canvas.getContext("2d")!
          const checkFace = () => {
            if (cancelled) return
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
              if (nonBlack / total > 0.5 && skinTone / total > 0.1) {
                setDeviceStatus(prev => ({ ...prev, faceDetected: "detected" }))
              } else {
                setDeviceStatus(prev => ({ ...prev, faceDetected: "not-detected" }))
                requestAnimationFrame(checkFace)
              }
            } else { requestAnimationFrame(checkFace) }
          }
          checkFace()
        }

        // 음성 입력 감지
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
            } else { requestAnimationFrame(checkAudio) }
          }
          checkAudio()
        }
      } catch {
        if (cancelled) return
        setDeviceStatus({ camera: "error", microphone: "error", faceDetected: "not-detected", audioInput: "not-detected" })
      }
    }

    checkDevices()
    return () => { cancelled = true; audioCtx?.close() }
  }, [phase])

  // 사전점검 비디오 ref 연결
  useEffect(() => {
    if (preCheckVideoRef.current && mediaStream) {
      preCheckVideoRef.current.srcObject = mediaStream
    }
  }, [mediaStream])

  // 토론 중 카메라 self-view
  useEffect(() => {
    if (debateVideoRef.current && mediaStream && phase === "debating") {
      debateVideoRef.current.srcObject = mediaStream
    }
  }, [mediaStream, phase])

  // 언마운트 시 미디어 스트림 정리
  useEffect(() => {
    return () => { mediaStream?.getTracks().forEach(t => t.stop()) }
  }, [mediaStream])

  // 사용자 턴 변경 시 녹음 상태 초기화
  useEffect(() => {
    if (!debateState?.waitingForUser) {
      setRecording(false)
      setSttReady(false)
    }
  }, [debateState?.waitingForUser])

  // 녹음 완료 후 1.5초 대기 → sttReady (DB write 여유 시간)
  useEffect(() => {
    if (recording || !sttTranscript) return
    const timer = setTimeout(() => setSttReady(true), 1500)
    return () => clearTimeout(timer)
  }, [recording, sttTranscript])

  const handleSubmitTurn = async () => {
    if (!sessionId || submitting || !sttReady) return
    setSubmitting(true)
    try {
      await submitDebateTurn(sessionId)
      setSttReady(false)
      setRecording(false)
      setPollTrigger(prev => prev + 1)
    } catch {
      // keep state on error
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnd = async () => {
    if (!sessionId) return
    try {
      await endDebateSession(sessionId)
    } catch {
      // end 실패해도 리포트는 생성됐을 수 있음
    }
    router.push(`/reports/debate/${sessionId}`)
  }

  const difficultyLabel: Record<string, string> = {
    EASY: "쉬움",
    NORMAL: "보통",
    HARD: "어려움",
  }

  const categoryLabel: Record<string, string> = {
    AI_ETHICS: "AI 윤리",
    RECRUITMENT: "채용",
    DEV_CULTURE: "개발 문화",
    TECH_TREND: "기술 트렌드",
  }

  // Pre-check helper
  const allPassed =
    deviceStatus.camera === "connected" &&
    deviceStatus.microphone === "connected" &&
    deviceStatus.faceDetected === "detected" &&
    deviceStatus.audioInput === "detected"

  const getStatusIcon = (status: string) => {
    if (status === "connected" || status === "detected") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    if (status === "error" || status === "not-detected") return <XCircle className="h-4 w-4 text-rose-400" />
    return <div className="h-4 w-4 animate-pulse rounded-full bg-muted-foreground/50" />
  }

  const getStatusText = (status: string) => {
    if (status === "connected" || status === "detected") return "정상"
    if (status === "error" || status === "not-detected") return "미연결"
    return "확인 중..."
  }

  const handleRetest = () => {
    mediaStream?.getTracks().forEach(t => t.stop())
    setMediaStream(null)
    setDeviceStatus({ camera: "checking", microphone: "checking", faceDetected: "checking", audioInput: "checking" })
    setPhase("precheck")
  }

  // Pre-check 전체화면
  if (phase === "precheck") {
    const statusItems = [
      { icon: Camera, label: "카메라 연결 상태", status: deviceStatus.camera },
      { icon: Mic, label: "마이크 연결 상태", status: deviceStatus.microphone },
      { icon: User, label: "얼굴 인식 여부", status: deviceStatus.faceDetected },
      { icon: Volume2, label: "음성 입력 감지", status: deviceStatus.audioInput },
    ]
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => router.push("/dashboard")}>
            <ChevronLeft className="h-4 w-4" />
            대시보드로 돌아가기
          </Button>
          <h1 className="text-lg font-semibold text-foreground">토론 면접 사전 점검</h1>
          <div className="w-[160px]" />
        </header>
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="flex w-full max-w-3xl flex-col gap-6">
            <div className="space-y-3">
              <div className="relative mx-auto aspect-video max-w-2xl overflow-hidden rounded-2xl border border-border/50 bg-secondary/50">
                {mediaStream ? (
                  <>
                    <video ref={preCheckVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
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
                  <div className={cn("h-2 w-2 rounded-full", mediaStream ? "animate-pulse bg-rose-500" : "bg-muted-foreground")} />
                  <span className="text-xs font-medium text-foreground">{mediaStream ? "LIVE" : "OFF"}</span>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {mediaStream ? "얼굴을 중앙에 맞추고 말씀해 주세요" : "카메라 권한을 허용해주세요"}
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {statusItems.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-border/30 bg-card p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground text-center">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(item.status)}
                      <span className={cn("text-xs font-medium",
                        item.status === "connected" || item.status === "detected" ? "text-emerald-400" :
                        item.status === "error" || item.status === "not-detected" ? "text-rose-400" : "text-muted-foreground"
                      )}>{getStatusText(item.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 rounded-xl border border-border/30 bg-card p-4">
                {allPassed ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">모든 점검이 완료되었습니다</p>
                      <p className="text-sm text-muted-foreground">토론 설정을 시작할 준비가 되었어요</p>
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
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-1.5 border-border/50" onClick={handleRetest}>
                  <RotateCcw className="h-4 w-4" />
                  다시 테스트
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  disabled={!allPassed}
                  onClick={() => setPhase("setup")}
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />

      <main className="pt-14 lg:pl-64 lg:pt-0">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (phase === "setup" && setupStep > 1) {
                  setSetupStep((setupStep - 1) as SetupStep)
                } else {
                  router.push("/dashboard")
                }
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">토론 면접</h1>
              <p className="text-sm text-muted-foreground">
                {phase === "setup" && "토론 설정"}
                {phase === "debating" && "토론 진행 중"}
                {phase === "ending" && "토론 종료"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : phase === "setup" ? (
            <div className="space-y-6">
              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        step === setupStep
                          ? "bg-primary text-white"
                          : step < setupStep
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`h-0.5 w-8 ${step < setupStep ? "bg-primary/40" : "bg-border"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Topic Selection */}
              {setupStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">토론 주제 선택</h2>

                  {categories.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={categoryFilter === "all" ? "default" : "outline"}
                        onClick={() => setCategoryFilter("all")}
                      >
                        전체
                      </Button>
                      {categories.map(cat => (
                        <Button
                          key={cat}
                          size="sm"
                          variant={categoryFilter === cat ? "default" : "outline"}
                          onClick={() => setCategoryFilter(cat)}
                        >
                          {categoryLabel[cat] ?? cat}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredTopics.map(topic => (
                      <Card
                        key={topic.id}
                        className={`cursor-pointer transition-all ${
                          selectedTopic?.id === topic.id
                            ? "border-primary bg-primary/5"
                            : "border-border/50 hover:border-primary/30"
                        }`}
                        onClick={() => setSelectedTopic(topic)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{topic.title}</h3>
                            <Badge variant="outline" className="shrink-0 text-xs">{categoryLabel[topic.category] ?? topic.category}</Badge>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredTopics.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">주제가 없습니다</p>
                  )}
                </div>
              )}

              {/* Step 2: Stance Selection */}
              {setupStep === 2 && selectedTopic && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">입장 선택</h2>
                  <p className="text-sm text-muted-foreground">{selectedTopic.title}</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card
                      className={`cursor-pointer transition-all ${
                        selectedStance === "PRO"
                          ? "border-blue-500 bg-blue-500/5"
                          : "border-border/50 hover:border-blue-500/30"
                      }`}
                      onClick={() => setSelectedStance("PRO")}
                    >
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                            <Target className="h-4 w-4 text-blue-500" />
                          </div>
                          <h3 className="font-semibold text-foreground">찬성</h3>
                        </div>
                        <ul className="space-y-1">
                          {selectedTopic.proKeyPoints.map((point, i) => (
                            <li key={i} className="text-xs text-muted-foreground">- {point}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all ${
                        selectedStance === "CON"
                          ? "border-rose-500 bg-rose-500/5"
                          : "border-border/50 hover:border-rose-500/30"
                      }`}
                      onClick={() => setSelectedStance("CON")}
                    >
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10">
                            <Swords className="h-4 w-4 text-rose-500" />
                          </div>
                          <h3 className="font-semibold text-foreground">반대</h3>
                        </div>
                        <ul className="space-y-1">
                          {selectedTopic.conKeyPoints.map((point, i) => (
                            <li key={i} className="text-xs text-muted-foreground">- {point}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 3: Persona Selection */}
              {setupStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">면접 상대 선택</h2>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {personas.map(persona => (
                      <Card
                        key={persona.id}
                        className={`cursor-pointer transition-all ${
                          selectedPersona?.id === persona.id
                            ? "border-primary bg-primary/5"
                            : "border-border/50 hover:border-primary/30"
                        }`}
                        onClick={() => setSelectedPersona(persona)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">{persona.name}</h3>
                            <Badge variant="secondary" className="text-xs">{persona.difficulty}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{persona.background}</p>
                          <p className="text-xs text-muted-foreground/70">스타일: {persona.debateStyle}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Difficulty + Confirm */}
              {setupStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">설정 확인</h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                      <span className="text-sm text-muted-foreground">주제</span>
                      <span className="text-sm font-medium text-foreground">{selectedTopic?.title}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                      <span className="text-sm text-muted-foreground">입장</span>
                      <Badge variant={selectedStance === "PRO" ? "default" : "secondary"}>
                        {selectedStance === "PRO" ? "찬성" : "반대"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                      <span className="text-sm text-muted-foreground">상대</span>
                      <span className="text-sm font-medium text-foreground">{selectedPersona?.name}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                      <span className="text-sm text-muted-foreground">난이도</span>
                      <Select
                        value={selectedDifficulty}
                        onValueChange={(v) => setSelectedDifficulty(v as "EASY" | "NORMAL" | "HARD")}
                      >
                        <SelectTrigger className="w-28 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">쉬움</SelectItem>
                          <SelectItem value="NORMAL">보통</SelectItem>
                          <SelectItem value="HARD">어려움</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSetupStep((setupStep - 1) as SetupStep)}
                  disabled={setupStep === 1}
                >
                  이전
                </Button>
                {setupStep < 4 ? (
                  <Button
                    onClick={() => setSetupStep((setupStep + 1) as SetupStep)}
                    disabled={!canProceed()}
                  >
                    다음
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleCreateSession} disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      "토론 시작"
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : phase === "debating" || phase === "ending" ? (
            <div className="flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
              {/* Topic Banner */}
              <div className="mb-3 rounded-lg border border-border/50 bg-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedTopic?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      내 입장: {selectedStance === "PRO" ? "찬성" : "반대"} · 난이도: {difficultyLabel[selectedDifficulty]}
                    </p>
                  </div>
                  {phase === "debating" && (
                    <Button variant="outline" size="sm" onClick={handleEnd} className="shrink-0">
                      토론 종료
                    </Button>
                  )}
                </div>
              </div>

              {/* Video Section — AI 경쟁자 (왼쪽) / 내 카메라 (오른쪽) */}
              <div className="mb-3 grid grid-cols-2 gap-3">
                {/* AI 경쟁자 */}
                <div className="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-secondary/30 py-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary border border-border/50 text-lg font-bold text-foreground">
                    {selectedPersona?.name?.slice(0, 1) ?? "A"}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{selectedPersona?.name ?? "AI 경쟁자"}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedStance === "PRO" ? "반대" : "찬성"}</p>
                  </div>
                  {polling && !debateState?.waitingForUser && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                      <div className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5">
                        <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">발언 중</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 내 카메라 */}
                <div className="relative overflow-hidden rounded-xl border border-border/50 bg-secondary/30">
                  {mediaStream ? (
                    <>
                      <video ref={debateVideoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" style={{ minHeight: "120px" }} />
                      <div className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5">
                        <p className="text-[10px] font-medium text-foreground">나 · {selectedStance === "PRO" ? "찬성" : "반대"}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2">
                      <User className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-[10px] text-muted-foreground">카메라 없음</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border/50 bg-card p-4">
                {debateState?.latestTurns.map((turn) => {
                  const isUser = turn.speakerType === "USER"
                  const isInterviewer = turn.speakerType === "AI_INTERVIEWER"

                  // 면접관 말 — 중앙 배너 스타일
                  if (isInterviewer) {
                    return (
                      <div key={turn.id} className="flex justify-center">
                        <div className="w-full max-w-[90%] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
                          <div className="mb-1.5 flex items-center justify-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">면접관</span>
                            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">{roundLabel[turn.round] ?? turn.round}</Badge>
                          </div>
                          <p className="text-center text-sm text-foreground leading-relaxed">{turn.content}</p>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={turn.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          isUser
                            ? "bg-primary text-white"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-medium opacity-70">
                            {isUser ? "나" : (selectedPersona?.name ?? "상대방")}
                          </span>
                          {turn.round && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${isUser ? "border-white/30 text-white/70" : ""}`}
                            >
                              {roundLabel[turn.round] ?? turn.round}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{turn.content}</p>
                      </div>
                    </div>
                  )
                })}

                {pollTimeout && !debateState?.waitingForUser && (
                  <div className="flex justify-center">
                    <p className="text-xs text-muted-foreground">응답이 지연되고 있습니다. 잠시만 기다려주세요.</p>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              {phase === "debating" && debateState?.waitingForUser && (
                <div className="mt-4 space-y-2">
                  {/* 실시간 트랜스크립트 */}
                  {sttTranscript && (
                    <div className="rounded-lg border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-foreground min-h-12">
                      {sttTranscript}
                    </div>
                  )}
                  {/* 피드백 */}
                  {sttFeedback && (
                    <p className="text-xs text-amber-500 px-1">{sttFeedback}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {/* 녹음 토글 버튼 */}
                    <Button
                      variant={recording ? "destructive" : "outline"}
                      onClick={() => {
                        if (recording) {
                          setRecording(false)
                        } else {
                          setSttReady(false)
                          setRecording(true)
                        }
                      }}
                      disabled={submitting || sttReady}
                      className="gap-2"
                    >
                      {recording ? (
                        <>
                          <MicOff className="h-4 w-4" />
                          녹음 완료
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          {sttTranscript ? "다시 녹음" : "녹음 시작"}
                        </>
                      )}
                    </Button>
                    {/* 오디오 레벨 인디케이터 */}
                    {recording && (
                      <div className="flex items-end gap-0.5 h-6">
                        {[0.4, 0.6, 1, 0.6, 0.4].map((scale, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full bg-primary transition-all duration-75"
                            style={{ height: `${Math.max(4, sttAudioLevel * scale * 0.24)}px` }}
                          />
                        ))}
                      </div>
                    )}
                    {/* 처리 중 표시 */}
                    {!recording && sttTranscript && !sttReady && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        처리 중...
                      </div>
                    )}
                    {/* 제출 버튼 */}
                    <Button
                      size="icon"
                      onClick={handleSubmitTurn}
                      disabled={!sttReady || submitting}
                      className="h-10 w-10 shrink-0 ml-auto"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Ending */}
              {phase === "ending" && (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-border/50 bg-card p-6">
                  <Trophy className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium text-foreground">토론이 종료되었습니다</p>
                  <Button onClick={handleEnd}>
                    리포트 확인하기
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
