"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { getPresignedUrl } from "@/lib/api/interview"

const CLIP_SEC = 15
const SAMPLE_MS = 1000

export type ClipReason = "pace" | "silence" | "filler" | "gaze"

interface SubScores {
  wpmScore: number
  silenceScore: number
  fillerScore: number
  gazeRatio: number
  gazeOffScore: number
}

function calcSubScores(
  wpm: number,
  silenceSec: number,
  fillerCount: number,
  gazeRatio: number,
  gazeOffCount: number,
): SubScores {
  const wpmScore =
    wpm === 0 ? 0
    : wpm < 80 ? (wpm / 80) * 100
    : wpm <= 150 ? 100
    : Math.max(0, ((250 - wpm) / 100) * 100)
  return {
    wpmScore,
    silenceScore: Math.max(0, 100 - silenceSec * 20),
    fillerScore: Math.max(0, 100 - fillerCount * 10),
    gazeRatio,
    gazeOffScore: Math.max(0, 100 - gazeOffCount * 20),
  }
}

function calcScore(sub: SubScores): number {
  return (sub.wpmScore + sub.silenceScore + sub.fillerScore + sub.gazeRatio + sub.gazeOffScore) / 5
}

// 구간 평균 세부 점수 중 가장 낮은 항목을 클립이 선택된 핵심 사유로 판단 (시선 비율·이탈은 같은 카테고리로 묶음)
function determineReason(avgSub: SubScores): ClipReason {
  const candidates: [ClipReason, number][] = [
    ["pace", avgSub.wpmScore],
    ["silence", avgSub.silenceScore],
    ["filler", avgSub.fillerScore],
    ["gaze", Math.min(avgSub.gazeRatio, avgSub.gazeOffScore)],
  ]
  return candidates.reduce((min, c) => (c[1] < min[1] ? c : min))[0]
}

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

interface ClipEntry {
  questionId: number
  blob: Blob
  score: number
  reason: ClipReason
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
  getPresignedUrlFn?: (sessionId: number, questionId: number) => Promise<{ uploadUrl: string; fileUrl: string }>
}

export interface UseClipRecorderReturn {
  uploadWorstClip: (sessionId: number) => Promise<{ url: string; score: number; questionId: number; reason: ClipReason } | null>
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
  getPresignedUrlFn,
}: Params): UseClipRecorderReturn {
  const clipsRef = useRef<ClipEntry[]>([])
  const stopPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const recorderRef = useRef<MediaRecorder | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const getPresignedUrlFnRef = useRef(getPresignedUrlFn ?? getPresignedUrl)
  useEffect(() => { getPresignedUrlFnRef.current = getPresignedUrlFn ?? getPresignedUrl }, [getPresignedUrlFn])

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
    const subScoresList: SubScores[] = []

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm"

    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 500_000 })
    } catch {
      return
    }
    recorderRef.current = recorder

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
        const windowSubScores = subScoresList.slice(worstStart, worstStart + win)
        const avgSub: SubScores = {
          wpmScore: average(windowSubScores.map((v) => v.wpmScore)),
          silenceScore: average(windowSubScores.map((v) => v.silenceScore)),
          fillerScore: average(windowSubScores.map((v) => v.fillerScore)),
          gazeRatio: average(windowSubScores.map((v) => v.gazeRatio)),
          gazeOffScore: average(windowSubScores.map((v) => v.gazeOffScore)),
        }
        clipsRef.current.push({
          questionId: capturedQuestionId,
          blob: new Blob(blobParts, { type: "video/webm" }),
          score: worstScore,
          reason: determineReason(avgSub),
        })
      }
      resolveStop()
    }

    recorder.start(SAMPLE_MS)

    const timer = setInterval(() => {
      const v = analysisRef.current
      const sub = calcSubScores(v.wpm, v.silenceSec, v.fillerCount, v.gazeRatio, v.gazeOffCount)
      scores.push(calcScore(sub))
      subScoresList.push(sub)
    }, SAMPLE_MS)

    return () => {
      clearInterval(timer)
      recorderRef.current = null
      if (recorder.state !== "inactive") recorder.stop()
    }
  }, [active, stream])

  const uploadWorstClip = useCallback(async (sessionId: number): Promise<{ url: string; score: number; questionId: number; reason: ClipReason } | null> => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
    await stopPromiseRef.current

    if (clipsRef.current.length === 0) return null

    const worst = clipsRef.current.reduce((min, c) => c.score < min.score ? c : min)
    setIsUploading(true)
    try {
      const { uploadUrl, fileUrl } = await getPresignedUrlFnRef.current(sessionId, worst.questionId)
      await fetch(uploadUrl, {
        method: "PUT",
        body: worst.blob,
        headers: { "Content-Type": "video/webm" },
      })
      clipsRef.current = []
      return { url: fileUrl, score: worst.score, questionId: worst.questionId, reason: worst.reason }
    } catch {
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { uploadWorstClip, isUploading }
}
