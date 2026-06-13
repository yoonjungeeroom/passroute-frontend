"use client"

import { useState } from "react"
import { ChevronDown, FileText, Briefcase } from "lucide-react"

/* 상단 가로 네비게이션 (기존 Sidebar 대체)
 * - '자료 관리'는 자체 페이지 없이 자기소개서/이력서·포폴로 펼쳐지는 그룹 */
const NAV: { label: string; href?: string; active?: boolean; children?: { label: string; desc: string; icon: any; href: string }[] }[] = [
  { label: "대시보드", href: "/dashboard", active: true },
  { label: "면접 일정", href: "/schedule" },
  {
    label: "자료 관리",
    children: [
      { label: "자기소개서", desc: "작성한 자기소개서 관리", icon: FileText, href: "/self-intro" },
      { label: "이력서/포트폴리오", desc: "이력서·포트폴리오 파일", icon: Briefcase, href: "/materials" },
    ],
  },
  { label: "리포트", href: "/reports" },
]

export function TopNav({ userName = "사용자" }: { userName?: string }) {
  const [open, setOpen] = useState<string | null>(null)
  const initials = userName.slice(0, 2)
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-[64px] w-full max-w-[1040px] items-center justify-between px-6">
        <div className="flex items-center gap-9">
          <a href="/dashboard" className="text-[20px] font-extrabold tracking-tight text-slate-900">passroute</a>
          <nav className="flex items-center gap-1">
            {NAV.map((it) => (
              <div key={it.label} className="relative">
                {it.children ? (
                  <button
                    onClick={() => setOpen(open === it.label ? null : it.label)}
                    className="relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    {it.label}
                    <ChevronDown size={14} className={"text-slate-400 transition-transform " + (open === it.label ? "rotate-180" : "")} />
                  </button>
                ) : (
                  <a
                    href={it.href}
                    className={"relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors " +
                      (it.active ? "text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}
                  >
                    {it.label}
                    {it.active && <span className="absolute inset-x-3.5 -bottom-[15px] h-0.5 rounded-full bg-blue-600" />}
                  </a>
                )}
                {it.children && open === it.label && (
                  <div className="absolute left-0 top-full z-30 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/[0.06]">
                    {it.children.map((c) => (
                      <a key={c.label} href={c.href} onClick={() => setOpen(null)} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><c.icon size={16} /></span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-slate-900">{c.label}</span>
                          <span className="block text-[11px] text-slate-400">{c.desc}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
        <button className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 transition-colors hover:bg-slate-50">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{initials}</span>
          <span className="whitespace-nowrap text-sm font-bold text-slate-900">{userName}</span>
          <ChevronDown size={14} className="shrink-0 text-slate-400" />
        </button>
      </div>
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(null)} />}
    </header>
  )
}
