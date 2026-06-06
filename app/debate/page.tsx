"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
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
  RotateCcw,
  ArrowRight,
  User,
  Clock,
  Lock,
} from "lucide-react"
import { PreCheckScreen } from "@/components/pre-check-screen"
import { cn } from "@/lib/utils"
import { useFaceAnalysis } from "@/hooks/use-face-analysis"

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
  submitDebateBranch,
  endDebateSession,
  type DebateTopic,
  type DebatePersona,
  type DebateStateResponse,
  type DebateTurn,
  type DebateRound,
  type DebateBranchChoice,
  type SpeakerType,
} from "@/lib/api/debate"
import { ApiError } from "@/lib/api/client"
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

// 채팅 로그 한 줄. 상대 발언은 백엔드 턴(key="c-<id>"), 내 발언은 확정 시 FE가 직접 추가(key="u-<seq>").
type ChatMessage = { key: string; speaker: "USER" | "AI_COMPETITOR"; content: string }

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
  const [retestKey, setRetestKey] = useState(0)
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
  // 분기 선택(반박 한 번 더 / 마무리) 전송 중인 선택지. 어느 버튼에 스피너를 띄울지 구분용.
  const [branchPending, setBranchPending] = useState<DebateBranchChoice | null>(null)
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playedTurnIds = useRef<Set<number>>(new Set()) // 이미 큐에 넣어 처리한 턴 id
  // 한 응답에 AI 턴이 여러 개 와도(상대 발언 + 면접관 cue 등) 동시에 띄우지 않고
  // id 오름차순으로 하나씩 공개(텍스트) + 재생(TTS)하기 위한 "턴 공개 큐".
  const revealQueueRef = useRef<DebateTurn[]>([])
  const isRevealingRef = useRef(false)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 지금까지 공개된 턴 id 집합. 화면 표시는 이 집합에 든 턴만 사용한다.
  const [revealedTurnIds, setRevealedTurnIds] = useState<Set<number>>(new Set())
  // 공개 큐가 비워지는 동안 true — 입력창/분기 버튼을 잠깐 가려 새 턴이 다 공개된 뒤 노출되게 한다.
  const [revealing, setRevealing] = useState(false)
  // 채팅 로그 — 발언이 시간순으로 쌓인다(삽입 순서 = 시간순). 면접관은 채팅에 넣지 않고 상단 배너에만.
  // 상대 발언은 공개 시점에 백엔드 턴으로 누적, 내 발언은 "확정" 시 FE가 한 번만 추가(중복 방지).
  const [chatTurns, setChatTurns] = useState<ChatMessage[]>([])
  const userMsgSeqRef = useRef(0) // 내 발언 버블의 안정 key 생성용
  // 현재 공개 중인 턴의 화자 — 상대 카드 "발언 중" 표시를 화자에 맞게 켜기 위함(면접관 cue 땐 끔).
  const [revealingSpeaker, setRevealingSpeaker] = useState<SpeakerType | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // STT
  const [recording, setRecording] = useState(false)
  const [sttReady, setSttReady] = useState(false)
  // 빈 발화(409 DEBATE_STT_NOT_READY) 등 제출 관련 안내 메시지
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
  const currentRound = debateState?.currentState
    ? (STATE_TO_ROUND[debateState.currentState] ?? null)
    : null
  const { transcript: sttTranscript, wpm: sttWpm, fillerCount: sttFillerCount, silenceSec: sttSilenceSec, audioLevel: sttAudioLevel, feedback: sttFeedback } =
    useDebateSTT({ sessionId, round: currentRound, stream: mediaStream, active: recording })

  // 실시간 얼굴 분석 — 녹음 중일 때만 활성 (1:1면접과 동일)
  const { gazeRatio, blinkCount, gazeOffCount } = useFaceAnalysis({
    sessionId: sessionId ?? 0,
    videoRef: debateVideoRef,
    active: recording && sessionId !== null,
  })

  // 면접관 최신 멘트 — 공개된 AI_INTERVIEWER 턴만 대상(상단 배너용). latestTurns는 오래된→최신 순.
  const latestInterviewerTurn = debateState?.latestTurns
    ? [...debateState.latestTurns].reverse().find(t => t.speakerType === "AI_INTERVIEWER" && revealedTurnIds.has(t.id))
    : undefined

  // 상대 카드 "발언 중" — 상대 턴을 공개 중이거나, (아무것도 공개 안 하는 채로) AI 응답 생성 폴링 중일 때만.
  // 면접관 cue를 공개 중일 때(revealingSpeaker=AI_INTERVIEWER)는 켜지 않는다.
  const competitorSpeaking =
    revealingSpeaker === "AI_COMPETITOR" ||
    (polling && !debateState?.waitingForUser && !revealing)
  // 내 발언 미확정 버블 표시 — 말하는 중(라이브)이거나, 중지 후 확정/평가 대기 동안 그대로 유지(사라지지 않게).
  const showPendingBubble = recording || (isPractice && (sttReady || awaitingEval || !!feedbackTurn))

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
        if (state.waitingForUser || state.awaitingDecision) {
          // 사용자 발언 차례거나 분기 선택(반박 추가/마무리) 대기면 폴링 중단.
          // cue 상태(면접관 멘트 재생 중)는 둘 다 false → 폴링 계속하며 다음 상태로 진행.
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


  // 세션 변경 및 언마운트 시 오디오 정지 + 공개 큐/기록 초기화
  useEffect(() => {
    playedTurnIds.current.clear()
    revealQueueRef.current = []
    isRevealingRef.current = false
    setRevealedTurnIds(new Set())
    setRevealing(false)
    setRevealingSpeaker(null)
    setChatTurns([])
    userMsgSeqRef.current = 0
    return () => {
      // cleanup 이후 큐의 다음 턴이 이어 공개/재생되지 않도록 큐·타이머·onended를 모두 해제.
      // 단, audioRef 요소 자체는 null로 버리지 않는다 — handleCreateSession의 사용자 제스처로
      // 자동재생 잠금이 풀린 단일 요소라, 새로 만들면(세션 생성 직후 cleanup 포함) 자동재생이 다시 차단된다.
      revealQueueRef.current = []
      isRevealingRef.current = false
      if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null }
      if (audioRef.current) {
        audioRef.current.onended = null
        audioRef.current.onerror = null
        audioRef.current.pause()
      }
    }
  }, [sessionId])

  // 채팅 로그에 상대 발언 누적 — 백엔드 AI_COMPETITOR 턴만(면접관 제외, 내 발언은 확정 시 별도 추가).
  // 삽입 순서가 곧 시간순. key로 dedupe해 같은 턴이 두 번 들어가지 않게 한다.
  const appendCompetitorTurn = useCallback((turn: DebateTurn) => {
    if (turn.speakerType !== "AI_COMPETITOR") return
    const key = `c-${turn.id}`
    setChatTurns(prev => prev.some(m => m.key === key) ? prev : [...prev, { key, speaker: "AI_COMPETITOR", content: turn.content }])
  }, [])

  // 공개 큐에서 다음 턴 하나를 공개(화면 표시) + TTS 재생.
  // 오디오가 있으면 재생이 끝났을 때(onended), 없으면 짧은 딜레이 후 다음 턴으로 넘어간다.
  const revealNext = useCallback(() => {
    // 이전 단계의 예약 타이머/이벤트핸들러를 먼저 정리해 중복 진행을 막는다.
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null }
    if (audioRef.current) { audioRef.current.onended = null; audioRef.current.onerror = null }

    const turn = revealQueueRef.current.shift()
    if (!turn) {
      isRevealingRef.current = false
      setRevealing(false)
      setRevealingSpeaker(null)
      return
    }
    isRevealingRef.current = true
    setRevealing(true)
    setRevealingSpeaker(turn.speakerType)
    // 이 턴을 공개 (화면에 노출) + 채팅 로그에 누적(상대 발언만, 면접관은 배너)
    setRevealedTurnIds(prev => {
      const next = new Set(prev)
      next.add(turn.id)
      return next
    })
    appendCompetitorTurn(turn)

    if (turn.audioUrl) {
      // handleCreateSession에서 활성화해 둔 단일 오디오 요소를 재사용 (자동재생 차단 방지)
      const audio = audioRef.current ?? (audioRef.current = new Audio())
      audio.onended = () => revealNext()
      // 재생 중 디코드/로드 오류로 ended가 안 와도 막히지 않도록 (입력창이 큐에 묶여 있으므로 중요)
      audio.onerror = () => { advanceTimerRef.current = setTimeout(revealNext, 600) }
      audio.pause()
      audio.src = turn.audioUrl
      audio.currentTime = 0
      audio.play().catch((e) => {
        console.warn("[debate] TTS 자동재생 실패:", e)
        // 재생 실패해도 다음 턴으로 진행 (한 턴 실패가 이후 공개를 막지 않도록)
        advanceTimerRef.current = setTimeout(revealNext, 600)
      })
    } else {
      // 오디오 없는 턴은 잠깐 보여주고 다음으로 (동시 노출 방지용 최소 간격)
      advanceTimerRef.current = setTimeout(revealNext, 1200)
    }
  }, [appendCompetitorTurn])

  // 새로 도착한 턴을 공개 큐에 적재.
  // - AI 턴(상대/면접관): id 오름차순으로 큐에 쌓아 하나씩 공개 → 상대 발언 + 면접관 cue가
  //   한 응답에 같이 와도 동시에 뜨지 않고 순서대로 표시+재생된다. 클로징 TTS 누락도 같이 해결.
  // - USER 턴: 즉시 공개 처리만(혹시 모를 재진입 방지). 채팅 버블은 백엔드 턴이 아니라
  //   "확정" 시 FE가 한 번만 추가하므로(시도/확정 중복 방지) 여기선 채팅에 넣지 않는다.
  useEffect(() => {
    if (!debateState?.latestTurns) return
    const incoming = debateState.latestTurns.filter(t => !playedTurnIds.current.has(t.id))
    if (incoming.length === 0) return
    for (const t of incoming) playedTurnIds.current.add(t.id)

    const userTurns = incoming.filter(t => t.speakerType === "USER")
    if (userTurns.length > 0) {
      setRevealedTurnIds(prev => {
        const next = new Set(prev)
        userTurns.forEach(t => next.add(t.id))
        return next
      })
    }

    const aiTurns = incoming
      .filter(t => t.speakerType !== "USER")
      .sort((a, b) => a.id - b.id) // 도착 순서 보장 (id 오름차순 = 생성 순)
    if (aiTurns.length === 0) return
    revealQueueRef.current.push(...aiTurns)
    if (!isRevealingRef.current) revealNext()
  }, [debateState?.latestTurns, revealNext])

  // 새 발언/라이브 STT가 쌓이면 채팅 맨 아래로 자동 스크롤
  useEffect(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chatTurns, recording, sttTranscript])

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
  }, [phase, topicId, retestKey])

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
      setSubmitNotice(null)
    }
  }, [debateState?.waitingForUser])

  // 전사(WS {status:"completed"}) 확보 + 녹음 종료 시 즉시 제출 가능.
  // body content로 전사를 직접 보내므로 pending_stt(AI 비동기 DB쓰기) 타이밍을 기다릴 필요가 없다.
  useEffect(() => {
    if (recording) return
    if (sttTranscript.trim()) setSttReady(true)
  }, [recording, sttTranscript])

  // 확정 제출 — REAL은 즉시 lock, PRACTICE는 평가 패널에서 "확정" 시. commit=true → AI 진행.
  const handleCommit = async () => {
    if (!sessionId || submitting) return
    setSubmitting(true)
    setSubmitNotice(null)
    try {
      const committed = sttTranscript.trim()
      await submitDebateTurn(sessionId, sttTranscript, true)
      // 확정된 내 발언을 채팅에 한 번만 추가(연습만 표시, 실전은 잠금). 백엔드 USER 턴은 채팅에 안 넣어 중복 방지.
      if (isPractice && committed) {
        const key = `u-${userMsgSeqRef.current++}`
        setChatTurns(prev => [...prev, { key, speaker: "USER", content: committed }])
      }
      setSttReady(false)
      setRecording(false)
      setFeedbackTurn(null)
      setAwaitingEval(false)
      prevEvalTurnIdRef.current = null
      shownEvalIdRef.current = null
      setPollTrigger(prev => prev + 1) // 폴링 재개 → AI 응답 대기
    } catch (err) {
      // 빈 발화(아직 인식된 게 없음) → 치명적 아님, 재시도/재녹음 안내
      if (err instanceof ApiError && err.code === "DB006") {
        setSubmitNotice("아직 인식된 발화가 없어요. 잠시 후 다시 시도하거나 다시 말씀해 주세요.")
      }
      // keep state on error
    } finally {
      setSubmitting(false)
    }
  }

  // 시도 제출 (PRACTICE 전용) — commit=false. 평가만 받고 라운드는 유지, 평가 도착을 폴링한다.
  const handleAttempt = async () => {
    if (!sessionId || submitting || !sttReady) return
    setSubmitting(true)
    setSubmitNotice(null)
    try {
      prevEvalTurnIdRef.current = shownEvalIdRef.current // 직전에 노출한 평가 턴은 무시 (재시도 교체 대비)
      await submitDebateTurn(sessionId, sttTranscript, false)
      setSttReady(false)
      setRecording(false)
      setFeedbackTurn(null)
      setAwaitingEval(true) // 평가 도착 폴링 시작
    } catch (err) {
      // 빈 발화(아직 인식된 게 없음) → 치명적 아님, 재시도/재녹음 안내
      if (err instanceof ApiError && err.code === "DB006") {
        setSubmitNotice("아직 인식된 발화가 없어요. 잠시 후 다시 시도하거나 다시 말씀해 주세요.")
      }
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

  // 반박 종료 후 분기 선택 전송 — rebut_again(반박 한 번 더) / finish(토론 마무리).
  // 성공 시 폴링 재개 → 다음 cue/상태로 진행. 실패 시 버튼 유지(재시도 가능).
  const handleBranch = async (choice: DebateBranchChoice) => {
    if (!sessionId || branchPending) return
    setBranchPending(choice)
    setSubmitNotice(null)
    try {
      await submitDebateBranch(sessionId, choice)
      setPollTrigger(prev => prev + 1)
    } catch {
      // 실패 시 버튼 유지 + 안내(재시도 가능). DECISION 상태는 발화 입력 UI와 겹치지 않아 submitNotice 재사용 안전.
      setSubmitNotice("분기 선택에 실패했습니다. 다시 시도해 주세요.")
    } finally {
      setBranchPending(null)
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

  const handleRetest = () => {
    mediaStream?.getTracks().forEach(t => t.stop())
    setMediaStream(null)
    setDeviceStatus({ camera: "checking", microphone: "checking", faceDetected: "checking", audioInput: "checking" })
    setRetestKey(k => k + 1)
  }

  // Pre-check 전체화면
  if (phase === "precheck") {
    return (
      <PreCheckScreen
        deviceStatus={deviceStatus}
        stream={mediaStream}
        onRetest={handleRetest}
        onComplete={handleCreateSession}
        onBack={() => router.push("/dashboard")}
        title="토론 면접 사전 점검"
      />
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
            <div className="flex gap-3" style={{ height: "calc(100dvh - 160px)" }}>
            <div className="flex flex-1 flex-col min-w-0">
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
              {/* 면접관(사회자) 멘트 — 상단 배너 */}
              {latestInterviewerTurn && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">면접관</span>
                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">{roundLabel[latestInterviewerTurn.round] ?? latestInterviewerTurn.round}</Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{latestInterviewerTurn.content}</p>
                </div>
              )}

              {/* 화자 카드 — 상대(왼쪽) / 나(오른쪽). 말하는 쪽에 보더 글로우 */}
              <div className="mb-2 grid grid-cols-2 gap-2 sm:gap-3">
                {/* AI 경쟁자 */}
                <div className={cn(
                  "relative flex h-28 flex-col items-center justify-center gap-1.5 rounded-xl border bg-secondary/30 transition-all sm:h-36",
                  competitorSpeaking ? "border-primary/60 ring-2 ring-primary/20" : "border-border/50"
                )}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary border border-border/50 text-base font-bold text-foreground sm:h-14 sm:w-14 sm:text-lg">
                    {selectedPersona?.name?.slice(0, 1) ?? "A"}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{selectedPersona?.name ?? "AI 경쟁자"}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedStance === "PRO" ? "반대" : "찬성"}</p>
                  </div>
                  {competitorSpeaking && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                      <div className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5">
                        <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">발언 중</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 내 카메라 */}
                <div className={cn(
                  "relative h-28 overflow-hidden rounded-xl border bg-secondary/30 transition-all sm:h-36",
                  recording ? "border-rose-500/70 ring-2 ring-rose-500/20" : "border-border/50"
                )}>
                  {mediaStream ? (
                    <>
                      <video ref={debateVideoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" />
                      <div className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5">
                        <p className="text-[10px] font-medium text-foreground">나 · {selectedStance === "PRO" ? "찬성" : "반대"}</p>
                      </div>
                      {recording && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-rose-500/90 px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          <span className="text-[10px] font-medium text-white">REC</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <User className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-[10px] text-muted-foreground">카메라 없음</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 발언 채팅 로그 — 공개된 상대/내 발언이 카톡식으로 아래로 쌓인다(상대 왼쪽·내 발언 오른쪽).
                  면접관은 상단 배너에만. 실전 모드는 잠금(내용은 종료 후 리포트). */}
              <div ref={chatScrollRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-border/50 bg-card p-3">
                {isPractice ? (
                  chatTurns.length === 0 && !showPendingBubble ? (
                    <p className="text-xs text-muted-foreground">아직 발언이 없습니다</p>
                  ) : (
                    chatTurns.map((m) => {
                      const isMe = m.speaker === "USER"
                      return (
                        <div key={m.key} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                          <div className="flex max-w-[80%] flex-col gap-0.5">
                            <span className={cn("text-[10px] text-muted-foreground", isMe ? "text-right" : "text-left")}>
                              {isMe ? "나" : (selectedPersona?.name ?? "AI 경쟁자")}
                            </span>
                            <div className={cn(
                              "rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                              isMe
                                ? "rounded-br-sm bg-primary text-primary-foreground"
                                : "rounded-bl-sm bg-secondary text-foreground"
                            )}>
                              {m.content}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )
                ) : !showPendingBubble ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3 shrink-0" /> 실전 모드 · 발언은 종료 후 리포트에서
                  </p>
                ) : null}

                {/* 내 미확정 발언 — 말하는 중(라이브)이거나 중지 후 확정/평가 대기 동안 그대로 유지(오른쪽, 옅은 색).
                    "확정" 시 위 chatTurns에 정식 버블로 한 번만 합류하므로 중복되지 않는다. */}
                {showPendingBubble && (
                  <div className="flex justify-end">
                    <div className="flex max-w-[80%] flex-col gap-0.5">
                      <span className="text-right text-[10px] text-muted-foreground">{recording ? "나 · 입력 중" : "나"}</span>
                      <div className="rounded-2xl rounded-br-sm bg-primary/60 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground">
                        {sttTranscript || (recording ? "말씀해 주세요…" : "")}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {pollTimeout && !debateState?.waitingForUser && (
                <p className="mt-2 text-center text-xs text-muted-foreground">응답이 지연되고 있습니다. 잠시만 기다려주세요.</p>
              )}

              {/* Input Area — 공개 큐 비워진 뒤에만(revealing=false). 배치 응답에 waitingForUser가 같이 와도
                  새 턴 공개가 끝난 다음 입력창이 뜨도록 한다. */}
              {phase === "debating" && debateState?.waitingForUser && !revealing && (
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
                      {/* 실시간 트랜스크립트는 내 카메라 하단 자막에서 표시 (중복 제거) */}
                      {/* 실시간 STT 피드백 — 연습 모드에서만 (실전은 종료 후 리포트에서 한 번에) */}
                      {isPractice && sttFeedback && (
                        <p className="text-xs text-amber-500 px-1">{sttFeedback}</p>
                      )}
                      {/* 빈 발화 제출 등 안내 (409 DEBATE_STT_NOT_READY) */}
                      {submitNotice && (
                        <p className="text-xs text-rose-500 px-1">{submitNotice}</p>
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
                              setSubmitNotice(null)
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

              {/* 분기 선택 — 반박 라운드 종료 후(REBUTTAL_1_DECISION). 발언이 아니라 버튼 선택.
                  availableChoices에 rebut_again이 없으면(REBUTTAL_2 후) '토론 마무리'만 노출. */}
              {phase === "debating" && debateState?.awaitingDecision && !revealing && (() => {
                const choices = debateState.availableChoices ?? ["rebut_again", "finish"]
                const canRebutAgain = choices.includes("rebut_again")
                return (
                  <div className="mt-4 space-y-2">
                    <p className="text-center text-sm text-muted-foreground">
                      {canRebutAgain ? "반박을 한 번 더 할까요, 토론을 마무리할까요?" : "토론을 마무리할까요?"}
                    </p>
                    {submitNotice && (
                      <p className="text-center text-xs text-rose-500">{submitNotice}</p>
                    )}
                    <div className="flex items-center gap-2">
                      {canRebutAgain && (
                        <Button
                          variant="outline"
                          className="flex-1 gap-1.5"
                          disabled={branchPending !== null}
                          onClick={() => handleBranch("rebut_again")}
                        >
                          {branchPending === "rebut_again" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                          반박 한 번 더
                        </Button>
                      )}
                      <Button
                        className="flex-1 gap-1.5"
                        disabled={branchPending !== null}
                        onClick={() => handleBranch("finish")}
                      >
                        {branchPending === "finish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        토론 마무리
                      </Button>
                    </div>
                  </div>
                )
              })()}

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

            {/* 실시간 분석 패널 (xl 이상에서만 표시) */}
            <div className="hidden xl:flex w-48 shrink-0 flex-col">
              <AnalysisPanel title="실시간 분석">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">음성</div>
                <div className="mb-3 grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg border border-border bg-background p-1.5 text-center">
                    <div className="text-sm font-bold text-foreground">{sttWpm > 0 ? Math.round(sttWpm) : "--"}</div>
                    <div className="text-[9px] text-muted-foreground">WPM</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-1.5 text-center">
                    <div className="text-sm font-bold text-foreground">{sttSilenceSec > 0 ? sttSilenceSec.toFixed(1) : "--"}</div>
                    <div className="text-[9px] text-muted-foreground">침묵(초)</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-1.5 text-center">
                    <div className="text-sm font-bold text-foreground">{sttFillerCount > 0 ? sttFillerCount : "--"}</div>
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
