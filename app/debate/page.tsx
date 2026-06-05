"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  Loader2,
  Send,
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
  Clock,
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
  type DebateTurn,
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

type Phase = "precheck" | "prep" | "debating" | "ending"

function DebatePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicIdParam = searchParams?.get("topicId")
  const stanceParam = searchParams?.get("stance") as "PRO" | "CON" | null
  const personaIdParam = searchParams?.get("personaId")
  const difficultyParam = searchParams?.get("difficulty") as "EASY" | "NORMAL" | "HARD" | null
  const topicTitleParam = searchParams?.get("topicTitle") // 생성 주제는 정적 목록에 없어 배너 제목 폴백용
  // 연습/실전 모드. modal이 "practice" | "real"로 전달 (real = 실전/EXAM). 누락 시 연습으로 간주.
  const isExam = searchParams?.get("mode") === "real"
  const isPractice = !isExam

  // 쿼리스트링을 한 번만 안전하게 파싱 (누락/비숫자는 NaN, 잘못된 stance는 false)
  const topicId = topicIdParam ? Number(topicIdParam) : NaN
  const personaId = personaIdParam ? Number(personaIdParam) : NaN
  const isValidStance = stanceParam === "PRO" || stanceParam === "CON"

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

  // Setup state (선택값은 모달에서 쿼리스트링으로 전달받음)
  const [phase, setPhase] = useState<Phase>("precheck")
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null)
  const [selectedStance] = useState<"PRO" | "CON" | null>(stanceParam ?? null)
  const [selectedPersona, setSelectedPersona] = useState<DebatePersona | null>(null)
  const [selectedDifficulty] = useState<"EASY" | "NORMAL" | "HARD">(difficultyParam ?? "NORMAL")
  const [creating, setCreating] = useState(false)

  // Debate state
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [debateState, setDebateState] = useState<DebateStateResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [polling, setPolling] = useState(false)
  const [pollTrigger, setPollTrigger] = useState(0)
  // 실전 모드 준비시간 카운트다운 (precheck → prep → debating)
  const [prepSeconds, setPrepSeconds] = useState(60)
  const [prepRemaining, setPrepRemaining] = useState(0)
  const startedRef = useRef(false) // startDebateSession 중복 호출 방지
  // PRACTICE 즉시 피드백 / 재시도 (commit=false 시도 → 평가 노출 → 다시 말하기/확정)
  const [feedbackTurn, setFeedbackTurn] = useState<DebateTurn | null>(null)
  const [awaitingEval, setAwaitingEval] = useState(false)
  const prevEvalTurnIdRef = useRef<number | null>(null) // 재시도 폴링에서 무시할 직전 평가 턴 id
  const shownEvalIdRef = useRef<number | null>(null) // 마지막으로 노출한 평가 턴 id
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

  // 쿼리스트링 누락/오류 시 대시보드로 (모달을 거치지 않은 직접 접근)
  useEffect(() => {
    if (isNaN(topicId) || isNaN(personaId) || !isValidStance) {
      router.replace("/dashboard")
    }
  }, [topicId, personaId, isValidStance, router])

  // 모달에서 선택한 주제/상대를 id로 다시 조회해 매칭 (진행 화면 배너 표시용)
  useEffect(() => {
    if (isNaN(topicId) || isNaN(personaId)) return
    async function load() {
      try {
        const [t, p] = await Promise.all([getDebateTopics(), getDebatePersonas()])
        setSelectedTopic(t.find(x => x.id === topicId) ?? null)
        setSelectedPersona(p.find(x => x.id === personaId) ?? null)
      } catch {
        // 조회 실패 시 배너 정보만 비어있을 뿐 토론은 진행 가능
      }
    }
    load()
  }, [topicId, personaId])

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
    // handleCreateSession에서 활성화해 둔 단일 오디오 요소를 재사용 (자동재생 차단 방지)
    const audio = audioRef.current ?? (audioRef.current = new Audio())
    audio.pause()
    audio.src = newAudioTurn.audioUrl
    audio.currentTime = 0
    audio.play().catch((e) => console.warn("[debate] TTS 자동재생 실패:", e))
  }, [debateState?.latestTurns])

  const handleCreateSession = async () => {
    if (isNaN(topicId) || isNaN(personaId) || !stanceParam) return
    // 자동재생 정책 우회 — 사용자 클릭(제스처) 안에서 오디오 요소를 미리 활성화
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {})
    setCreating(true)
    try {
      const res = await createDebateSession({
        topicId,
        userStance: stanceParam,
        personaId,
        difficulty: selectedDifficulty,
        mode: isExam ? "real" : "practice",
      })
      setSessionId(res.sessionId)
      if (isExam) {
        // 실전: 준비시간 카운트다운 후 토론 시작 (start는 prep 종료 시 호출)
        const secs = res.prepSeconds ?? 60
        setPrepSeconds(secs)
        setPrepRemaining(secs)
        setPhase("prep")
      } else {
        // 연습: 준비시간 없이 바로 시작
        startedRef.current = true
        await startDebateSession(res.sessionId)
        setPhase("debating")
      }
    } catch {
      // 세션 생성 실패
    } finally {
      setCreating(false)
    }
  }

  // 실전 모드 준비시간 카운트다운 — 0이 되면 토론 시작
  useEffect(() => {
    if (phase !== "prep") return
    if (prepRemaining <= 0) {
      if (startedRef.current || !sessionId) return
      startedRef.current = true
      // start 성공 시에만 진입. 실패하면 폴링·발화 제출이 모두 깨지므로 대시보드로 복귀.
      startDebateSession(sessionId)
        .then(() => setPhase("debating"))
        .catch(() => router.replace("/dashboard"))
      return
    }
    const timer = setTimeout(() => setPrepRemaining((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, prepRemaining, sessionId])

  // 사전점검 — 카메라+마이크 획득 및 디바이스 체크
  useEffect(() => {
    if (phase !== "precheck" || isNaN(topicId)) return
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
  }, [phase, topicId])

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

  // 확정 제출 — REAL은 즉시 lock, PRACTICE는 평가 패널에서 "확정" 시. commit=true → AI 진행.
  const handleCommit = async () => {
    if (!sessionId || submitting) return
    setSubmitting(true)
    try {
      await submitDebateTurn(sessionId, true)
      setSttReady(false)
      setRecording(false)
      setFeedbackTurn(null)
      setAwaitingEval(false)
      prevEvalTurnIdRef.current = null
      shownEvalIdRef.current = null
      setPollTrigger(prev => prev + 1) // 폴링 재개 → AI 응답 대기
    } catch {
      // keep state on error
    } finally {
      setSubmitting(false)
    }
  }

  // 시도 제출 (PRACTICE 전용) — commit=false. 평가만 받고 라운드는 유지, 평가 도착을 폴링한다.
  const handleAttempt = async () => {
    if (!sessionId || submitting || !sttReady) return
    setSubmitting(true)
    try {
      prevEvalTurnIdRef.current = shownEvalIdRef.current // 직전에 노출한 평가 턴은 무시 (재시도 교체 대비)
      await submitDebateTurn(sessionId, false)
      setSttReady(false)
      setRecording(false)
      setFeedbackTurn(null)
      setAwaitingEval(true) // 평가 도착 폴링 시작
    } catch {
      // keep state on error
    } finally {
      setSubmitting(false)
    }
  }

  // PRACTICE: 시도 제출 후 평가(weightedScore) 도착을 폴링 → 피드백 패널 노출
  useEffect(() => {
    if (!awaitingEval || !sessionId) return
    let cancelled = false
    let tries = 0
    async function pollEval() {
      if (cancelled || !sessionId) return
      try {
        const state = await getDebateState(sessionId)
        if (cancelled) return
        setDebateState(state)
        const round = STATE_TO_ROUND[state.currentState] ?? null
        // 가장 최근 사용자 턴만 후보로 본다. 그 턴이 아직 평가 전이면 계속 대기 —
        // 이렇게 해야 3회차 이상 재시도 시 옛 시도의 평가를 잘못 매칭하지 않는다.
        const latestUserTurn = [...state.latestTurns]
          .reverse()
          .find((t) => t.speakerType === "USER" && t.round === round)
        if (
          latestUserTurn &&
          latestUserTurn.weightedScore != null &&
          latestUserTurn.id !== prevEvalTurnIdRef.current
        ) {
          shownEvalIdRef.current = latestUserTurn.id
          setFeedbackTurn(latestUserTurn)
          setAwaitingEval(false)
          return
        }
      } catch {
        // 일시 오류는 재시도로 흡수
      }
      tries++
      if (tries > 40) { // 약 60초 후 폴백 — 평가 못 받아도 진행 막지 않음
        setAwaitingEval(false)
        return
      }
      setTimeout(pollEval, 1500)
    }
    pollEval()
    return () => { cancelled = true }
  }, [awaitingEval, sessionId])

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
        <header className="flex items-center justify-between border-b border-border/50 px-4 py-4 sm:px-6">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground shrink-0" onClick={() => router.push("/dashboard")}>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">대시보드로 돌아가기</span>
          </Button>
          <h1 className="text-base font-semibold text-foreground sm:text-lg">토론 면접 사전 점검</h1>
          <div className="hidden w-[160px] sm:block" />
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
                      <p className="text-sm text-muted-foreground">토론을 시작할 준비가 되었어요</p>
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
                  disabled={!allPassed || creating}
                  onClick={handleCreateSession}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      토론 준비 중...
                    </>
                  ) : (
                    <>
                      토론 시작
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 실전 모드 준비시간 전체화면
  if (phase === "prep") {
    const mm = String(Math.floor(prepRemaining / 60)).padStart(2, "0")
    const ss = String(prepRemaining % 60).padStart(2, "0")
    const progress = prepSeconds > 0 ? prepRemaining / prepSeconds : 0
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <Badge variant="outline" className="gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-400">
            <Clock className="h-3.5 w-3.5" />
            실전 모드 · 준비 시간
          </Badge>
          <div>
            <p className="text-sm text-muted-foreground">주제</p>
            <h1 className="mt-1 text-lg font-semibold text-foreground">{selectedTopic?.title ?? topicTitleParam}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              내 입장: {selectedStance === "PRO" ? "찬성" : "반대"}
            </p>
          </div>
          {/* 카운트다운 */}
          <div className="relative flex h-44 w-44 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="6" className="stroke-secondary" />
              <circle
                cx="50" cy="50" r="45" fill="none" strokeWidth="6" strokeLinecap="round"
                className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
              />
            </svg>
            <span className="text-4xl font-bold tabular-nums text-foreground">{mm}:{ss}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            준비 시간 동안 논리를 정리하세요.<br />
            시간이 끝나면 자동으로 토론이 시작됩니다.
          </p>
        </div>
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
              onClick={() => router.push("/dashboard")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">토론 면접</h1>
              <p className="text-sm text-muted-foreground">
                {phase === "debating" && "토론 진행 중"}
                {phase === "ending" && "토론 종료"}
              </p>
            </div>
          </div>

          {phase === "debating" || phase === "ending" ? (
            <div className="flex flex-col" style={{ height: "calc(100dvh - 160px)" }}>
              {/* Topic Banner */}
              <div className="mb-3 rounded-lg border border-border/50 bg-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedTopic?.title ?? topicTitleParam}</p>
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
              <div className="mb-3 grid grid-cols-2 gap-2 sm:gap-3">
                {/* AI 경쟁자 */}
                <div className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-secondary/30 py-3 sm:py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary border border-border/50 text-base font-bold text-foreground sm:h-14 sm:w-14 sm:text-lg">
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
                      <video ref={debateVideoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" style={{ minHeight: "90px" }} />
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
                        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 sm:max-w-[90%] sm:px-4 sm:py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
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
                        className={`max-w-[85%] rounded-2xl px-3 py-2.5 sm:max-w-[75%] sm:px-4 sm:py-3 ${
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
                  {isPractice && feedbackTurn ? (
                    /* PRACTICE: 턴 평가 패널 → 다시 말하기 / 확정 */
                    <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">이번 발언 피드백</p>
                        {feedbackTurn.weightedScore != null && (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
                            {feedbackTurn.weightedScore.toFixed(1)}점
                          </Badge>
                        )}
                      </div>
                      {feedbackTurn.evalStrengths && (
                        <div>
                          <p className="text-xs font-medium text-emerald-500">잘한 점</p>
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{feedbackTurn.evalStrengths}</p>
                        </div>
                      )}
                      {feedbackTurn.evalImprovements && (
                        <div>
                          <p className="text-xs font-medium text-amber-500">개선할 점</p>
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{feedbackTurn.evalImprovements}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          className="flex-1 gap-1.5"
                          disabled={submitting}
                          onClick={() => {
                            // 다시 말하기 — 평가 패널 닫고 재녹음. 다음 제출(commit=false)이 직전 시도를 교체.
                            setFeedbackTurn(null)
                            setSttReady(false)
                            setRecording(false)
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                          다시 말하기
                        </Button>
                        <Button
                          className="flex-1 gap-1.5"
                          disabled={submitting}
                          onClick={handleCommit}
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                          확정하고 다음으로
                        </Button>
                      </div>
                    </div>
                  ) : isPractice && awaitingEval ? (
                    /* PRACTICE: 평가 도착 대기 */
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-secondary/30 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      발언을 평가하고 있어요...
                    </div>
                  ) : (
                    <>
                      {/* 실시간 트랜스크립트 */}
                      {sttTranscript && (
                        <div className="rounded-lg border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-foreground min-h-12">
                          {sttTranscript}
                        </div>
                      )}
                      {/* 실시간 STT 피드백 — 연습 모드에서만 (실전은 종료 후 리포트에서 한 번에) */}
                      {isPractice && sttFeedback && (
                        <p className="text-xs text-amber-500 px-1">{sttFeedback}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 녹음 토글 (제출 전 재녹음은 양 모드 모두 허용) */}
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
                          disabled={submitting}
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
                        {/* 제출 — PRACTICE는 시도(commit=false)→평가, REAL은 확정(commit=true)→잠금 */}
                        <Button
                          onClick={isPractice ? handleAttempt : handleCommit}
                          disabled={!sttReady || submitting}
                          className="shrink-0 ml-auto gap-1.5"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              {isPractice ? "평가 받기" : "제출"}
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
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

export default function DebatePage() {
  return (
    <Suspense>
      <DebatePageInner />
    </Suspense>
  )
}
