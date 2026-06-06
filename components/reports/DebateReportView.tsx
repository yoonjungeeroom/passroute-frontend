"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RotateCcw, BarChart2 } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBrain, faChartLine, faStar, faArrowTrendUp, faLightbulb, faComments } from "@fortawesome/free-solid-svg-icons"
import type { DebateReportResponse } from "@/types/report"

const ROUND_LABEL: Record<string, string> = {
  OPENING: "개회",
  REBUTTAL_1: "반론1",
  REBUTTAL_2: "반론2",
  CLOSING: "마무리",
  MODERATION: "사회",
}

export function DebateReportView({
  report,
  onReplay,
  onDetail,
  compact = false,
}: {
  report: DebateReportResponse
  onReplay?: () => void
  onDetail?: () => void
  /** 리포트 목록 토글에서 핵심만 간략히 노출 (상세 섹션 숨김) */
  compact?: boolean
}) {
  return (
    <div className="space-y-6">
      {/* 종합 평가 */}
      <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
          <FontAwesomeIcon icon={faLightbulb} className="h-3.5 w-3.5 text-amber-500" />
          종합 평가
        </h4>
        <p className="text-sm leading-relaxed text-muted-foreground">{report.overall}</p>
      </div>

      {/* 라운드별 피드백 */}
      {report.turnFeedback?.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faChartLine} className="h-3.5 w-3.5 text-primary" />
            라운드별 피드백
          </h4>
          {report.turnFeedback.map((tf, i) => (
            <div key={i} className="rounded-lg border border-border/50 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="outline" className="text-xs">
                  {ROUND_LABEL[tf.roundType] ?? tf.roundType}
                </Badge>
                <span className="text-xs font-bold text-foreground">
                  {typeof tf.weightedScore === "number" ? tf.weightedScore.toFixed(1) : tf.weightedScore}점
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{tf.feedback}</p>
            </div>
          ))}
        </div>
      )}

      {/* 강점 & 개선점 */}
      <div className="grid gap-4 sm:grid-cols-2">
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

      {/* 상세 섹션 — 목록 토글(compact)에서는 숨기고, 상세보기 페이지에서만 노출 */}
      {!compact && (
        <>
          {/* 전략 분석 */}
          {report.strategyAnalysis && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <h4 className="mb-2 text-sm font-semibold text-blue-600 flex items-center gap-2">
                <FontAwesomeIcon icon={faBrain} className="h-3.5 w-3.5" />
                전략 분석
              </h4>
              <p className="text-sm text-muted-foreground">{report.strategyAnalysis}</p>
            </div>
          )}

          {/* 토론 준비도 코멘트 */}
          {report.debateReadinessComment && (
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <h4 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
                <FontAwesomeIcon icon={faComments} className="h-3.5 w-3.5 text-primary" />
                토론 준비도
              </h4>
              <p className="text-sm text-muted-foreground">{report.debateReadinessComment}</p>
            </div>
          )}

          {/* 최종 조언 */}
          {report.finalAdvice && (
            <div className="rounded-xl bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">{report.finalAdvice}</p>
            </div>
          )}
        </>
      )}

      {/* 액션 */}
      {(onReplay || onDetail) && (
        <div className="flex gap-2 pt-2">
          {onReplay && (
            <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={onReplay}>
              <RotateCcw className="h-3 w-3" />
              재연습
            </Button>
          )}
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
