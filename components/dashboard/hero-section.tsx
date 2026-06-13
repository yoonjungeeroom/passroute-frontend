"use client"

import { ArrowRight, Mic } from "lucide-react"

interface HeroSectionProps {
  onStartInterview: () => void
  userName?: string
}

export function HeroSection({ onStartInterview, userName = "사용자" }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-12 py-16">
      <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,.55), transparent 70%)" }} />
      <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,.18), transparent 70%)" }} />
      <div className="pointer-events-none absolute right-12 bottom-0 text-white opacity-[0.06]"><Mic size={210} strokeWidth={1} /></div>
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div>
          <h2 className="text-[28px] font-extrabold leading-[1.45] tracking-tight text-white lg:text-[32px]">
            {userName}님, 혼자 준비하기 어려웠던 면접,<br />
            <span className="text-blue-400">PASSROUTE</span>와 함께 돌파하세요
          </h2>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-slate-300">
            AI가 질문하고, 분석하고, 성장을 돕습니다.
          </p>
        </div>
        <button
          onClick={onStartInterview}
          className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-blue-600 px-7 py-4 text-[15px] font-bold text-white shadow-lg shadow-blue-900/40 transition-colors hover:bg-blue-500"
        >
          면접 시작하기 <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
