"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { getPresignedUrl } from "@/lib/api/interview"

const CLIP_SEC = 15
const SAMPLE_MS = 1000

function calcScore(
  wpm: number,
  silenceSec: number,
  fillerCount: number,
  gazeRatio: number,
  gazeOffCount: number,
): number {
  const wpmScore =
    wpm === 0 ? 0
    : wpm < 80 ? (wpm / 80) * 100
    : wpm <= 150 ? 100
    : Math.max(0, ((250 - wpm) / 100) * 100)
  const silenceScore = Math.max(0, 100 - silenceSec * 20)
  const fillerScore = Math.max(0, 100 - fillerCount * 10)
  const gazeOffScore = Math.max(0, 100 - gazeOffCount * 20)
  return (wpmScore + silenceScore + fillerScore + gazeRatio + gazeOffScore) / 5
}

interface ClipEntry {
  questionId: number
  blob: Blob
  score: number
}

interface Params {
  stream: MediaStream | null
  active: boolean
  questionId: number
  wpm: number
  silenceSec: number
  fillerCount: number
  gazeRatio: number
  gazeOffCount: number
}

export interface UseClipRecorderReturn {
  uploadWorstClip: (sessionId: number) => Promise<{ url: string; score: number } | null>
  isUploading: boolean
}

export function useClipRecorder({
  stream,
  active,
  questionId,
  wpm,
  silenceSec,
  fillerCount,
  gazeRatio,
  gazeOffCount,
}: Params): UseClipRecorderReturn {
  const clipsRef = useRef<ClipEntry[]>([])
  const stopPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const [isUploading, setIsUploading] = useState(false)

  const analysisRef = useRef({ wpm, silenceSec, fillerCount, gazeRatio, gazeOffCount })
  useEffect(() => {
    analysisRef.current = { wpm, silenceSec, fillerCount, gazeRatio, gazeOffCount }
  }, [wpm, silenceSec, fillerCount, gazeRatio, gazeOffCount])

  const questionIdRef = useRef(questionId)
  useEffect(() => { questionIdRef.current = questionId }, [questionId])

  useEffect(() => {
    if (!active || !stream) return

    const capturedQuestionId = questionIdRef.current
    const chunks: Blob[] = []
    const scores: number[] = []

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm"

    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 500_000 })
    } catch {
      return
    }

    let resolveStop!: () => void
    stopPromiseRef.current = new Promise<void>((res) => { resolveStop = res })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      if (chunks.length > 0 && scores.length > 0) {
        const win = Math.min(CLIP_SEC, scores.length)
        let worstScore = Infinity
        let worstStart = 0
        for (let i = 0; i <= scores.length - win; i++) {
          const avg = scores.slice(i, i + win).reduce((a, b) => a + b, 0) / win
          if (avg < worstScore) { worstScore = avg; worstStart = i }
        }
        const s = Math.min(worstStart, chunks.length - 1)
        const e2 = Math.min(worstStart + win, chunks.length)
        // chunk[0]에 WebM EBML 헤더가 있으므로, 선택 구간이 0번째가 아니면 앞에 붙임
        const blobParts = s === 0 ? chunks.slice(s, e2) : [chunks[0], ...chunks.slice(s, e2)]
        clipsRef.current.push({
          questionId: capturedQuestionId,
          blob: new Blob(blobParts, { type: "video/webm" }),
          score: worstScore,
        })
      }
      resolveStop()
    }

    recorder.start(SAMPLE_MS)

    const timer = setInterval(() => {
      const v = analysisRef.current
      scores.push(calcScore(v.wpm, v.silenceSec, v.fillerCount, v.gazeRatio, v.gazeOffCount))
    }, SAMPLE_MS)

    return () => {
      clearInterval(timer)
      if (recorder.state !== "inactive") recorder.stop()
    }
  }, [active, stream])

  const uploadWorstClip = useCallback(async (sessionId: number): Promise<{ url: string; score: number } | null> => {
    await stopPromiseRef.current

    if (clipsRef.current.length === 0) return null

    const worst = clipsRef.current.reduce((min, c) => c.score < min.score ? c : min)
    setIsUploading(true)
    try {
      const { uploadUrl, fileUrl } = await getPresignedUrl(sessionId, worst.questionId)
      await fetch(uploadUrl, {
        method: "PUT",
        body: worst.blob,
        headers: { "Content-Type": "video/webm" },
      })
      clipsRef.current = []
      return { url: fileUrl, score: worst.score }
    } catch {
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { uploadWorstClip, isUploading }
}
