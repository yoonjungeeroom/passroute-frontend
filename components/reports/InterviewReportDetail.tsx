"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faMicrophone,
  faEye,
  faListCheck,
  faTriangleExclamation,
  faClipboardCheck,
  faCircleCheck,
  faWandMagicSparkles,
  faMagnifyingGlass,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons"
import { cn } from "@/lib/utils"
import type {
  InterviewReportResponse, QuestionFeedback, DetailedFeedback, FactCheck,
} from "@/types/report"

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

// 펼칠 만한 상세 내용이 실제로 있는지 (없으면 토글/섹션 자체를 안 그림)
function hasDetailContent(df: DetailedFeedback | null | undefined): df is DetailedFeedback {
  return !!df && !!(
    df.strength || df.weakness || df.missingInfo.length ||
    df.improvementExample || df.suggestedAnswer || df.retryStrategy
  )
}
function hasFactCheck(fc: FactCheck | null | undefined): fc is FactCheck {
  return !!fc && fc.isFactCheckApplicable && (fc.incorrectClaims.length > 0 || fc.unsupportedClaims.length > 0)
}

// 구조화 피드백: 잘한 점 / 부족한 점 / 빠진 정보 / (60점 미만 한정) 개선 예시
function DetailedFeedbackBlock({ df, lowScore }: { df: DetailedFeedback; lowScore: boolean }) {
  const hasImprovement = !!(df.improvementExample || df.suggestedAnswer || df.retryStrategy)
  return (
    <div className="space-y-3">
      {(df.strength || df.weakness) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {df.strength && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                잘한 점
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{df.strength}</p>
            </div>
          )}
          {df.weakness && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" />
                부족한 점
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{df.weakness}</p>
            </div>
          )}
        </div>
      )}

      {df.missingInfo.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">답변에서 빠진 정보</p>
          <div className="flex flex-wrap gap-1.5">
            {df.missingInfo.map((m, i) => (
              <span key={i} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasImprovement && (
        <div className={cn(
          "rounded-lg border p-3.5",
          lowScore ? "border-primary/30 bg-primary/5" : "border-border/60 bg-background"
        )}>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3 w-3" />
            개선 예시
          </p>
          <div className="space-y-2.5">
            {df.improvementExample && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">이렇게 보완하면 좋아요</p>
                <p className="mt-0.5 text-xs leading-relaxed text-foreground">{df.improvementExample}</p>
              </div>
            )}
            {df.suggestedAnswer && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">추천 답변</p>
                <p className="mt-0.5 rounded-md border-l-2 border-primary/40 bg-primary/5 px-2.5 py-1.5 text-xs leading-relaxed text-foreground">
                  {df.suggestedAnswer}
                </p>
              </div>
            )}
            {df.retryStrategy && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">답변 전략</p>
                <p className="mt-0.5 text-xs leading-relaxed text-foreground">{df.retryStrategy}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 기술 사실 검증: 틀린 주장 4줄 교정 + 근거 필요 주장(약하게)
function FactCheckBlock({ fc }: { fc: FactCheck }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3.5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-red-500">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3 w-3" />
        기술 사실 검증
      </p>

      {fc.incorrectClaims.length > 0 && (
        <div className="space-y-2.5">
          {fc.incorrectClaims.map((c, i) => (
            <div key={i} className="rounded-md border border-border/60 bg-background p-3 text-xs leading-relaxed">
              {c.userClaim && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-red-500">내가 한 말</span>
                  {" · "}
                  <span className="line-through decoration-red-300">{c.userClaim}</span>
                </p>
              )}
              {c.issue && (
                <p className="mt-1 text-muted-foreground">
                  <span className="font-medium text-amber-600">무엇이 틀렸나</span>{" · "}{c.issue}
                </p>
              )}
              {c.correctExplanation && (
                <p className="mt-1 text-muted-foreground">
                  <span className="font-medium text-emerald-600">올바른 개념</span>{" · "}{c.correctExplanation}
                </p>
              )}
              {c.suggestedFix && (
                <p className="mt-1.5 rounded bg-primary/5 px-2 py-1 text-foreground">
                  <span className="font-medium text-primary">이렇게 고쳐 말하기</span>{" · "}{c.suggestedFix}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {fc.unsupportedClaims.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">근거가 필요한 주장</p>
          <ul className="space-y-1">
            {fc.unsupportedClaims.map((u, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {u}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function QuestionCard({ q, label }: { q: QuestionFeedback; label: string }) {
  const df = q.detailedFeedback
  const fc = q.factCheck
  const showDetail = hasDetailContent(df)
  const showFactCheck = hasFactCheck(fc)
  const lowScore = q.percentage != null && q.percentage < 60
  const expandable = showDetail || showFactCheck
  // 60점 미만은 개선 예시가 바로 보이도록 기본 펼침.
  const [open, setOpen] = useState(lowScore && expandable)

  return (
    <div className="rounded-lg border border-border/50 bg-background p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Q{label}</span>
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

      {expandable && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-primary transition-opacity hover:opacity-70"
          >
            <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="h-2.5 w-2.5" />
            {open ? "상세 피드백 접기" : "상세 피드백 보기"}
          </button>
          {open && (
            <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
              {showDetail && df && <DetailedFeedbackBlock df={df} lowScore={lowScore} />}
              {showFactCheck && fc && <FactCheckBlock fc={fc} />}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function InterviewReportDetail({ report }: { report: InterviewReportResponse }) {
  const { voiceAnalysis, faceAnalysis, questionFeedback, weaknesses, keyWeakness, finalAdvice, readinessComment } = report
  const questionLabels = buildQuestionLabels(questionFeedback)

  return (
    <div className="space-y-6">
      {/* 음성 / 시선 분석 */}
      {!voiceAnalysis && !faceAnalysis ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <FontAwesomeIcon icon={faMicrophone} className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            이 세션은 음성·시선 분석 데이터가 없어요. 영상 면접으로 진행하면 분석 결과가 제공됩니다.
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
                시선 분석
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
              <QuestionCard key={q.question_index ?? i} q={q} label={questionLabels[i]} />
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
