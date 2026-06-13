"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw, BarChart2 } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faStar, faArrowTrendUp, faLightbulb } from "@fortawesome/free-solid-svg-icons"
import { SkillBar } from "@/components/reports/SkillBar"
import { cn } from "@/lib/utils"
import type { InterviewReportResponse } from "@/types/report"

const CLIP_REASON_LABELS: Record<string, string> = {
  pace: "말하기 속도가 적절하지 않았던 구간이에요",
  silence: "침묵이 길었던 구간이에요",
  filler: "추임새가 많았던 구간이에요",
  gaze: "시선 처리가 아쉬웠던 구간이에요",
}

const ITEM_LABELS: Record<string, string> = {
  relevance: "관련성",
  logic: "논리성",
  specificity: "구체성",
  conciseness: "간결성",
  clarity: "명확성",
  jobRelevance: "직무 적합성",
  accuracy: "정확성",
  depth: "답변 깊이",
  authenticity: "진정성",
  growth: "성장 가능성",
}

export function InterviewReportView({
  report,
  worstClipUrl,
  worstClipReason,
  onReplay,
  onDetail,
  compact = false,
}: {
  report: InterviewReportResponse
  worstClipUrl?: string | null
  worstClipReason?: string | null
  onReplay?: () => void
  onDetail?: () => void
  compact?: boolean
}) {
  return (
    <div className="space-y-6">
      {/* 종합 평가 & 항목 점수 */}
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faLightbulb} className="h-3.5 w-3.5 text-amber-500" />
            종합 평가
          </h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{report.overall}</p>
        </div>
        <div className="space-y-3">
          {report.itemAverages && Object.entries(report.itemAverages).map(([key, val], i) => (
            <SkillBar key={key} label={ITEM_LABELS[key] ?? key} value={val as number} delay={i * 100} />
          ))}
        </div>
      </div>

      {/* 강점 & 개선점 */}
      <div className={cn("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h4 className="mb-2 text-sm font-semibold text-emerald-600 flex items-center gap-2">
            <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5" />
            강점
          </h4>
          <p className="text-sm text-muted-foreground">{report.strengths}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h4 className="mb-2 text-sm font-semibold text-amber-600 flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowTrendUp} className="h-3.5 w-3.5" />
            개선점
          </h4>
          <p className="text-sm text-muted-foreground">{report.improvements}</p>
        </div>
      </div>

      {/* 최악 클립 */}
      {worstClipUrl && (
        <div className="rounded-xl border border-border/50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground">개선 필요 구간</h4>
          {worstClipReason && CLIP_REASON_LABELS[worstClipReason] && (
            <p className="mb-2 text-sm text-muted-foreground">{CLIP_REASON_LABELS[worstClipReason]}</p>
          )}
          <video src={worstClipUrl} controls className="w-full rounded-lg" />
        </div>
      )}

      {/* 액션 */}
      {onDetail && (
        <div className="flex gap-2 pt-2">
          {onDetail && (
            <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={onDetail}>
              <BarChart2 className="h-3 w-3" />
              상세 분석
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
