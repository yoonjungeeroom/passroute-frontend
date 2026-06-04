"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronLeft, RotateCcw, AlertCircle, Clock } from "lucide-react"
import { getInterviewReport } from "@/lib/api/reports"
import { getWorstClip } from "@/lib/api/interview"
import { InterviewReportView } from "@/components/reports/InterviewReportView"
import { InterviewReportDetail } from "@/components/reports/InterviewReportDetail"
import type { InterviewReportResponse } from "@/types/report"

const POLL_INTERVAL_MS = 3000
const TIMEOUT_MS = 180_000

function InterviewReportContent() {
  const router = useRouter()
  const params = useParams()
  const sessionId = Number(params.sessionId)

  const [report, setReport] = useState<InterviewReportResponse | null>(null)
  const [worstClipUrl, setWorstClipUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<"loading" | "done" | "error" | "timeout">("loading")
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (params.sessionId === undefined) return
    if (!sessionId || isNaN(sessionId)) {
      setStatus("error")
      return
    }

    let cancelled = false
    const startTime = Date.now()
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      if (cancelled) return
      try {
        const result = await getInterviewReport(sessionId)
        if (cancelled) return

        if (result === null) {
          if (Date.now() - startTime >= TIMEOUT_MS) {
            setStatus("timeout")
            return
          }
          timer = setTimeout(poll, POLL_INTERVAL_MS)
        } else {
          setReport(result)
          // 최악 클립은 별도 조회 (실패해도 무시)
          getWorstClip(sessionId).then(url => { if (!cancelled) setWorstClipUrl(url) }).catch(() => {})
          setStatus("done")
        }
      } catch {
        if (!cancelled) setStatus("error")
      }
    }

    setStatus("loading")
    setReport(null)
    setWorstClipUrl(null)
    poll()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [sessionId, retryCount])

  const handleRetry = () => setRetryCount(c => c + 1)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="w-full overflow-auto lg:pl-64">
        <MobileHeader />
        <div className="px-4 py-8 sm:px-6 lg:px-8">

          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/reports")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">면접 리포트</h1>
              <p className="text-sm text-muted-foreground">AI 분석 결과</p>
            </div>
          </div>

          {status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-semibold text-foreground">리포트를 생성하고 있어요</p>
                <p className="mt-1 text-sm text-muted-foreground">보통 수십 초 정도 소요됩니다</p>
              </div>
            </div>
          )}

          {status === "timeout" && (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-7 w-7 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">생성이 지연되고 있어요</p>
                <p className="mt-1 text-sm text-muted-foreground">잠시 후 다시 시도해 주세요</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry} className="gap-1.5">
                  <RotateCcw className="h-4 w-4" />
                  다시 시도
                </Button>
                <Button variant="ghost" onClick={() => router.push("/reports")}>
                  목록으로
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">리포트 생성에 실패했어요</p>
                <p className="mt-1 text-sm text-muted-foreground">면접 진행 중 오류가 발생했을 수 있습니다</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry} className="gap-1.5">
                  <RotateCcw className="h-4 w-4" />
                  다시 시도
                </Button>
                <Button variant="ghost" onClick={() => router.push("/reports")}>
                  목록으로
                </Button>
              </div>
            </div>
          )}

          {status === "done" && report && (
            <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
              <div className="lg:sticky lg:top-8">
                <InterviewReportView report={report} worstClipUrl={worstClipUrl} compact />
              </div>
              <div className="lg:col-span-2">
                <InterviewReportDetail report={report} />
              </div>
            </div>
          )}
        </div>
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
