"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Mic,
  User,
  ChevronLeft,
} from "lucide-react"

interface DeviceStatus {
  camera: "checking" | "connected" | "error"
  microphone: "checking" | "connected" | "error"
  faceDetected: "checking" | "detected" | "not-detected"
  audioInput: "checking" | "detected" | "not-detected"
}

const PRECHECK_PHRASE = "안녕하세요. 면접을 시작하겠습니다."
const RECORDING_DURATION = 6000

export function PreCheckScreen({
  deviceStatus,
  stream,
  onRetest,
  onComplete,
  onBack,
  title = "면접 사전 점검",
}: {
  deviceStatus: DeviceStatus
  stream: MediaStream | null
  onRetest: () => void
  onComplete: () => void
  onBack?: () => void
  title?: string
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

  const startRecording = useCallback(() => {
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

    // STT 설정은 비동기로 백그라운드에서 실행 (progress 타이머를 막지 않도록)
    ;(async () => {
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
    })()

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
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          대시보드로 돌아가기
        </Button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <div className="w-[140px]" />
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-xl flex-col items-center gap-6">

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

          {phase === "recording" && (
            <div className="w-full space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-sm text-muted-foreground">분석 중...</p>
            </div>
          )}

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
