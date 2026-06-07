"use client"

import { Badge } from "@/components/ui/badge"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBrain, faChartLine, faComments, faClipboardCheck } from "@fortawesome/free-solid-svg-icons"
import { cn } from "@/lib/utils"
import { ROUND_LABEL, localizeRounds } from "@/lib/debate-rounds"
import type { DebateReportResponse } from "@/types/report"

// 100점 기준 점수 색상 (문항별 피드백과 동일 규칙)
function scoreColor(pct: number) {
  return pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-500"
}

export function DebateReportDetail({ report }: { report: DebateReportResponse }) {
  return (
    <div className="space-y-6">
      {/* 라운드별 피드백 — 문항별 피드백과 동일한 큰 점수 카드 스타일 */}
      {report.turnFeedback?.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FontAwesomeIcon icon={faChartLine} className="h-3.5 w-3.5 text-primary" />
            라운드별 피드백
          </h4>
          <div className="space-y-4">
            {report.turnFeedback.map((tf, i) => (
              <div key={i} className="rounded-lg border border-border/50 bg-background p-4 transition-colors hover:border-primary/30">
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-medium border-primary/30 bg-primary/10 text-primary">
                        {ROUND_LABEL[tf.roundType] ?? tf.roundType}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{localizeRounds(tf.feedback)}</p>
                  </div>
                  <div className="shrink-0 text-center">
                    <div className={cn("text-3xl font-bold leading-none", scoreColor(tf.weightedScore))}>
                      {typeof tf.weightedScore === "number" ? Math.round(tf.weightedScore) : tf.weightedScore}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">/ 100점</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전략 분석 */}
      {report.strategyAnalysis && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <h4 className="mb-2 text-sm font-semibold text-blue-600 flex items-center gap-2">
            <FontAwesomeIcon icon={faBrain} className="h-3.5 w-3.5" />
            전략 분석
          </h4>
          <p className="text-sm text-muted-foreground">{localizeRounds(report.strategyAnalysis)}</p>
        </div>
      )}

      {/* 토론 준비도 */}
      {report.debateReadinessComment && (
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faComments} className="h-3.5 w-3.5 text-primary" />
            토론 준비도
          </h4>
          <p className="text-sm text-muted-foreground">{localizeRounds(report.debateReadinessComment)}</p>
        </div>
      )}

      {/* 최종 조언 */}
      {report.finalAdvice && (
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FontAwesomeIcon icon={faClipboardCheck} className="h-3.5 w-3.5 text-primary" />
            최종 조언
          </h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{localizeRounds(report.finalAdvice)}</p>
        </div>
      )}
    </div>
  )
}
