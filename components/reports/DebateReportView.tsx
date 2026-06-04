"use client"

import { Badge } from "@/components/ui/badge"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBrain, faChartLine, faStar, faArrowTrendUp, faLightbulb, faComments, faListCheck } from "@fortawesome/free-solid-svg-icons"
import type { DebateReportResponse } from "@/types/report"

const ROUND_LABEL: Record<string, string> = {
  OPENING: "개회",
  REBUTTAL_1: "반론1",
  REBUTTAL_2: "반론2",
  CLOSING: "마무리",
  MODERATION: "사회",
}

export function DebateReportView({ report }: { report: DebateReportResponse }) {
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

      {/* 추천 토론 주제 */}
      {report.recommendedTopics.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faListCheck} className="h-3.5 w-3.5 text-primary" />
            추천 연습 주제
          </h4>
          <ul className="space-y-1.5">
            {report.recommendedTopics.map((topic, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {topic}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 최종 조언 */}
      {report.finalAdvice && (
        <div className="rounded-xl bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">{report.finalAdvice}</p>
        </div>
      )}
    </div>
  )
}
