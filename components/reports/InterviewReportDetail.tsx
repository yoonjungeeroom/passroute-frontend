"use client"

import { Badge } from "@/components/ui/badge"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faMicrophone,
  faEye,
  faListCheck,
  faTriangleExclamation,
  faClipboardCheck,
} from "@fortawesome/free-solid-svg-icons"
import { cn } from "@/lib/utils"
import type { InterviewReportResponse } from "@/types/report"

function scoreColor(pct: number) {
  return pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-500"
}

function MetricCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background p-3">
      <div className="text-lg font-bold text-foreground">
        {value}
        {unit && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

// 문항 라벨 계산: 꼬리질문(follow_up)은 직전 메인 질문의 하위 번호로 표기 (Q1, Q1-1, Q2 ...).
// 백엔드가 questionFeedback를 실제 진행 순서로 내려준다는 전제.
function buildQuestionLabels(questionFeedback: InterviewReportResponse["questionFeedback"]): string[] {
  const labels: string[] = []
  let main = 0
  let sub = 0
  for (const q of questionFeedback ?? []) {
    if (q.follow_up) {
      sub += 1
      labels.push(`${main || 1}-${sub}`)
    } else {
      main += 1
      sub = 0
      labels.push(`${main}`)
    }
  }
  return labels
}

export function InterviewReportDetail({ report }: { report: InterviewReportResponse }) {
  const { voiceAnalysis, faceAnalysis, questionFeedback, weaknesses, keyWeakness, finalAdvice, readinessComment } = report
  const questionLabels = buildQuestionLabels(questionFeedback)

  return (
    <div className="space-y-6">
      {/* 음성 / 표정 분석 */}
      {!voiceAnalysis && !faceAnalysis ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <FontAwesomeIcon icon={faMicrophone} className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            이 세션은 음성·표정 분석 데이터가 없어요. 영상 면접으로 진행하면 분석 결과가 제공됩니다.
          </p>
        </div>
      ) : (
        <div className={cn("grid gap-4", voiceAnalysis && faceAnalysis && "sm:grid-cols-2")}>
          {voiceAnalysis && (
            <div className="rounded-xl border border-border p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FontAwesomeIcon icon={faMicrophone} className="h-3.5 w-3.5 text-primary" />
                음성 분석
                <span className="ml-auto text-xs font-normal text-muted-foreground">{voiceAnalysis.voiceScore != null ? Math.round(voiceAnalysis.voiceScore) : "-"}점</span>
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <MetricCard label="말하기 속도" value={voiceAnalysis.avgWpm != null ? Math.round(voiceAnalysis.avgWpm) : "-"} unit="wpm" />
                <MetricCard label="평균 침묵" value={voiceAnalysis.avgSilenceDuration != null ? voiceAnalysis.avgSilenceDuration.toFixed(1) : "-"} unit="초" />
                <MetricCard label="간투어" value={voiceAnalysis.fillerCount ?? "-"} unit="회" />
              </div>
            </div>
          )}
          {faceAnalysis && (
            <div className="rounded-xl border border-border p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5 text-accent" />
                표정 분석
                <span className="ml-auto text-xs font-normal text-muted-foreground">{faceAnalysis.faceScore != null ? Math.round(faceAnalysis.faceScore) : "-"}점</span>
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <MetricCard label="시선 집중" value={faceAnalysis.avgGazeRatio != null ? String(Math.round(faceAnalysis.avgGazeRatio)) : "-"} unit="%" />
                <MetricCard label="시선 이탈" value={faceAnalysis.gazeOffCount ?? "-"} unit="회" />
                <MetricCard label="분당 깜빡임" value={faceAnalysis.avgBlinkPerMin != null ? Math.round(faceAnalysis.avgBlinkPerMin) : "-"} unit="회" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 문항별 피드백 */}
      {questionFeedback?.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FontAwesomeIcon icon={faListCheck} className="h-3.5 w-3.5 text-primary" />
            문항별 피드백
          </h4>
          <div className="space-y-4">
            {questionFeedback.map((q, i) => (
              <div key={q.question_index} className="rounded-lg border border-border/50 bg-background p-4 transition-colors hover:border-primary/30">
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Q{questionLabels[i]}</span>
                      {q.follow_up && (
                        <Badge variant="outline" className="text-[10px] font-medium border-amber-500/30 bg-amber-500/10 text-amber-700">
                          꼬리질문
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] font-medium border-primary/30 bg-primary/10 text-primary">
                        {q.question_type}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{q.feedback}</p>
                    {q.star_comment && (
                      <p className="mt-2.5 rounded-md bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-700">
                        STAR · {q.star_comment}
                      </p>
                    )}
                    {q.voice_comment && (
                      <p className="mt-1.5 rounded-md bg-primary/5 px-2.5 py-1.5 text-xs text-primary">
                        음성 · {q.voice_comment}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-center">
                    <div className={cn("text-3xl font-bold leading-none", scoreColor(q.percentage))}>
                      {q.percentage != null ? Math.round(q.percentage) : "-"}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">/ 100점</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 약점 */}
      {weaknesses?.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5" />
            주요 약점
          </h4>
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-foreground">{w.item}</span>
                <span className="text-muted-foreground"> — {w.comment}</span>
              </li>
            ))}
          </ul>
          {keyWeakness?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {keyWeakness.map((k, i) => (
                <Badge key={i} variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-700">
                  {k}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 최종 조언 */}
      {(finalAdvice || readinessComment) && (
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FontAwesomeIcon icon={faClipboardCheck} className="h-3.5 w-3.5 text-primary" />
            최종 조언
          </h4>
          {finalAdvice && <p className="text-sm leading-relaxed text-muted-foreground">{finalAdvice}</p>}
          {readinessComment && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{readinessComment}</p>}
        </div>
      )}
    </div>
  )
}
