"use client"

import { useState } from "react"
import { Check, Shield, Flame } from "lucide-react"

const MODE_DATA: Record<"solo" | "debate", { label: string; practice: { tagline: string; points: string[] }; real: { tagline: string; points: string[] } }> = {
  solo: {
    label: "1:1 면접",
    practice: {
      tagline: "마음 편하게, 충분히 연습",
      points: [
        "질문이 화면에 텍스트로도 함께 표시돼 놓치지 않고 확인 가능.",
        "‘다시 답변하기’로 만족할 때까지 답변 가능.",
        "답변 시간 제한 없이 내 속도대로 진행.",
        "음성·시선을 분석하는 실시간 피드백 패널로 바로바로 개선점 확인.",
      ],
    },
    real: {
      tagline: "진짜 면접처럼",
      points: [
        "질문은 음성으로만 안내, 텍스트는 숨겨 실제 면접관 앞처럼 듣고 반응.",
        "한 번 답한 답변은 재시도 불가 — 실전과 동일한 압박감.",
        "답변 시간 3분 30초 제한.",
      ],
    },
  },
  debate: {
    label: "토론 면접",
    practice: {
      tagline: "논리를 다듬는 시간",
      points: [
        "준비 시간 없이 바로 시작, 답변 시간 제한 없음.",
        "‘시도’로 점수·피드백을 먼저 보고 ‘확정’해 다음 라운드 진행.",
        "주제·입장 선택 시 찬성/반대 핵심 논거 미리보기 제공.",
        "상대·내 발화가 텍스트로 표시되어 지난 답변 확인 가능.",
        "음성·시선을 분석하는 실시간 피드백 패널로 바로바로 개선점 확인.",
      ],
    },
    real: {
      tagline: "실제 토론면접 그대로",
      points: [
        "준비 시간 60초 제공, 답변 시간 2분 제한.",
        "한 번 답변하면 바로 확정 — 재시도 불가.",
        "핵심 논거 미리보기 없이 스스로 논리를 구성.",
      ],
    },
  },
}

function ModeColumn({ real, icon: Icon, badge, tagline, points }: { real?: boolean; icon: any; badge: string; tagline: string; points: string[] }) {
  return (
    <div className={"flex flex-col border-t-[3px] p-7 " + (real ? "border-slate-900 bg-slate-50/70" : "border-blue-500 bg-white")}>
      <div className="flex items-center gap-3">
        <span className={"grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white " + (real ? "bg-slate-900" : "bg-blue-600")}><Icon size={20} /></span>
        <div className="min-w-0">
          <p className={"text-[11px] font-extrabold uppercase tracking-wider " + (real ? "text-slate-500" : "text-blue-600")}>{badge}</p>
          <p className="text-[16px] font-extrabold text-slate-900">“{tagline}”</p>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2.5">
            <span className={"mt-[3px] shrink-0 " + (real ? "text-slate-400" : "text-blue-500")}><Check size={15} strokeWidth={2.8} /></span>
            <span className="text-[13.5px] leading-relaxed text-slate-600">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ModeGuide() {
  const [type, setType] = useState<"solo" | "debate">("solo")
  const d = MODE_DATA[type]
  return (
    <section>
      <h3 className="text-[22px] font-extrabold tracking-tight text-slate-900">면접 유형별 진행 방식</h3>
      <p className="mt-1 mb-4 text-[13px] text-slate-400">1:1 면접과 토론 면접 모두, 연습 모드로 충분히 연습하고 실전 모드로 점검하세요</p>
      <div className="mb-5 inline-flex rounded-xl bg-slate-100 p-1">
        {(Object.entries(MODE_DATA) as ["solo" | "debate", typeof MODE_DATA.solo][]).map(([k, v]) => (
          <button key={k} onClick={() => setType(k)} className={"whitespace-nowrap rounded-lg px-5 py-2 text-sm font-bold transition-colors " + (type === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}>{v.label}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <ModeColumn icon={Shield} badge="연습 모드" tagline={d.practice.tagline} points={d.practice.points} />
          <ModeColumn real icon={Flame} badge="실전 모드" tagline={d.real.tagline} points={d.real.points} />
        </div>
      </div>
    </section>
  )
}
