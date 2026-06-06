"use client"

import { cn } from "@/lib/utils"

export function SkillBar({ label, value, max = 5, delay = 0 }: { label: string; value: number; max?: number; delay?: number }) {
  const pct = (value / max) * 100
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400"
  // 소수점 2자리까지만(예: 2.6666… → 2.67), 정수/딱 떨어지는 값은 그대로(3, 1.75) 표시
  const display = Number.isFinite(value) ? Number(value.toFixed(2)) : value
  return (
    <div className="group">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
        <span className="text-xs font-bold text-foreground">{display}<span className="text-muted-foreground font-normal">/{max}</span></span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/50">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  )
}
