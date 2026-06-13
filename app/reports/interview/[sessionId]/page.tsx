"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import { TopNav } from "@/components/dashboard/top-nav"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronLeft, RotateCcw, AlertCircle, Clock } from "lucide-react"
import { getInterviewReport } from "@/lib/api/reports"
import { getWorstClip } from "@/lib/api/interview"
import { InterviewReportView } from "@/components/reports/InterviewReportView"
import { InterviewReportDetail } from "@/components/reports/InterviewReportDetail"
import { getUserProfile } from "@/lib/api/user"
import type { InterviewReportResponse } from "@/types/report"

const POLL_INTERVAL_MS = 3000
const TIMEOUT_MS = 180_000

function InterviewReportContent() {
  const router = useRouter()
  const params = useParams()
  const sessionId = Number(params.sessionId)

  const [userName, setUserName] = useState("")
  const [report, setReport] = useState<InterviewReportResponse | null>(null)
  const [worstClip, setWorstClip] = useState<{ videoUrl: string; clipReason: string | null } | null>(null)
  const [status, setStatus] = useState<"loading" | "done" | "error" | "timeout">("loading")
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      getUserProfile().then((u) => setUserName(u.name)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (params.sessionId === undefined) return
    if (!sessionId || isNaN(sessionId)) { setStatus("error"); return }

    let cancelled = false
    const startTime = Date.now()
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      if (cancelled) return
      try {
        const result = await getInterviewReport(sessionId)
        if (cancelled) return
        if (result === null) {
          if (Date.now() - startTime >= TIMEOUT_MS) { setStatus("timeout"); return }
          timer = setTimeout(poll, POLL_INTERVAL_MS)
        } else {
          setReport(result)
          getWorstClip(sessionId)
            .then((clip) => { if (!cancelled) setWorstClip(clip) })
            .catch(() => {})
          setStatus("done")
        }
      } catch {
        if (!cancelled) setStatus("error")
      }
    }

    setStatus("loading")
    setReport(null)
    setWorstClip(null)
    poll()

    return () => { cancelled = true; clearTimeout(timer) }
  }, [sessionId, retryCount])

  const handleRetry = () => setRetryCount((c) => c + 1)

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <TopNav userName={userName} />

      <main className="mx-auto w-full max-w-[1040px] px-6 py-9">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/reports")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900">면접 리포트</h1>
            <p className="text-sm text-slate-400">AI 분석 결과</p>
          </div>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <div className="text-center">
              <p className="font-semibold text-slate-900">리포트를 생성하고 있어요</p>
              <p className="mt-1 text-sm text-slate-400">보통 수십 초 정도 소요됩니다</p>
            </div>
          </div>
        )}

        {status === "timeout" && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-7 w-7 text-amber-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">생성이 지연되고 있어요</p>
              <p className="mt-1 text-sm text-slate-400">잠시 후 다시 시도해 주세요</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetry} className="gap-1.5">
                <RotateCcw className="h-4 w-4" />
                다시 시도
              </Button>
              <Button variant="ghost" onClick={() => router.push("/reports")}>목록으로</Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <AlertCircle className="h-7 w-7 text-rose-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">리포트 생성에 실패했어요</p>
              <p className="mt-1 text-sm text-slate-400">면접 진행 중 오류가 발생했을 수 있습니다</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetry} className="gap-1.5">
                <RotateCcw className="h-4 w-4" />
                다시 시도
              </Button>
              <Button variant="ghost" onClick={() => router.push("/reports")}>목록으로</Button>
            </div>
          </div>
        )}

        {status === "done" && report && (
          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            <div className="lg:sticky lg:top-24">
              <InterviewReportView
                report={report}
                worstClipUrl={worstClip?.videoUrl}
                worstClipReason={worstClip?.clipReason}
                compact
              />
            </div>
            <div className="lg:col-span-2">
              <InterviewReportDetail report={report} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function InterviewReportPage() {
  return (
    <Suspense>
      <InterviewReportContent />
    </Suspense>
  )
}
