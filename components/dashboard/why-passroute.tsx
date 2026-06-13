"use client"

import { Mic, MessageSquare, BarChart3, Film } from "lucide-react"

const FEATURES = [
  { icon: Mic, title: "AI 모의면접", desc: "실전과 동일한 환경에서 AI 면접관과 대화형으로 연습." },
  { icon: MessageSquare, title: "심층 꼬리질문", desc: "자기소개서 기반으로 실제 나올 법한 꼬리질문 생성." },
  { icon: BarChart3, title: "실시간 분석 리포트", desc: "음성·시선·답변 구조를 분석해 성장 포인트 코칭." },
  { icon: Film, title: "구간 클립 저장", desc: "음성·시선 점수가 낮았던 구간을 클립으로 다시 보며 보완." },
]

export function WhyPassroute() {
  return (
    <section>
      <h3 className="mb-4 text-[22px] font-extrabold tracking-tight text-slate-900">PASSROUTE가 특별한 이유</h3>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-sm">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <f.icon size={20} strokeWidth={2.1} />
            </span>
            <h4 className="mt-4 text-[15px] font-bold text-slate-900">{f.title}</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
