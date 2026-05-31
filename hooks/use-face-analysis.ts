"use client"

import { useState, useEffect, useRef, useCallback, type RefObject } from "react"

interface UseFaceAnalysisParams {
  sessionId: number
  questionId: number
  videoRef: RefObject<HTMLVideoElement | null>
  active: boolean
}

interface UseFaceAnalysisReturn {
  gazeRatio: number
  gazeOn: boolean
  blinkCount: number
  ear: number
  faceDetected: boolean
  feedback: string | null
}

export function useFaceAnalysis({ sessionId, questionId, videoRef, active }: UseFaceAnalysisParams): UseFaceAnalysisReturn {
  const [gazeRatio, setGazeRatio] = useState(0)
  const [gazeOn, setGazeOn] = useState(false)
  const [blinkCount, setBlinkCount] = useState(0)
  const [ear, setEar] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const cleanup = useCallback(() => {
    clearInterval(intervalRef.current)
    if (wsRef.current) {
      wsRef.current.close(1000)
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!active || !questionId) {
      cleanup()
      return
    }

    const aiServerUrl = process.env.NEXT_PUBLIC_AI_WS_URL
    const ws = new WebSocket(`${aiServerUrl}/ws/face/${sessionId}/${questionId}`)
    wsRef.current = ws

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
      canvasRef.current.width = 320
      canvasRef.current.height = 240
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!

    ws.onopen = () => {
      intervalRef.current = setInterval(() => {
        const video = videoRef.current
        if (!video || video.videoWidth === 0 || ws.readyState !== WebSocket.OPEN) return

        ctx.drawImage(video, 0, 0, 320, 240)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
        ws.send(dataUrl)
      }, 500)
    }

    ws.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string)
        if (data.status === "face_data") {
          setFaceDetected(data.face_detected ?? false)
          if (data.gaze_ratio !== undefined) setGazeRatio(data.gaze_ratio)
          if (data.gaze_on !== undefined) setGazeOn(data.gaze_on)
          if (data.blink_in_window !== undefined) setBlinkCount(data.blink_in_window)
          if (data.ear !== undefined) setEar(data.ear)
        } else if (data.status === "feedback") {
          setFeedback(data.message || null)
          clearTimeout(feedbackTimerRef.current)
          feedbackTimerRef.current = setTimeout(() => setFeedback(null), 3000)
        }
      } catch { /* ignore */ }
    }

    ws.onerror = () => { /* silent */ }

    return () => {
      clearTimeout(feedbackTimerRef.current)
      cleanup()
    }
  }, [active, sessionId, questionId, videoRef, cleanup])

  useEffect(() => {
    setGazeRatio(0)
    setGazeOn(false)
    setBlinkCount(0)
    setEar(0)
    setFaceDetected(false)
    setFeedback(null)
  }, [questionId])

  return { gazeRatio, gazeOn, blinkCount, ear, faceDetected, feedback }
}
