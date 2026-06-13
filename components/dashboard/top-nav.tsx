"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, FileText, Briefcase, Settings, LogOut } from "lucide-react"

const NAV: {
  label: string
  href?: string
  children?: { label: string; desc: string; icon: React.ElementType; href: string }[]
}[] = [
  { label: "면접 일정", href: "/schedule" },
  {
    label: "자료 관리",
    children: [
      { label: "자기소개서", desc: "작성한 자기소개서 관리", icon: FileText, href: "/self-intro" },
      { label: "이력서/포트폴리오", desc: "이력서·포트폴리오 파일", icon: Briefcase, href: "/materials" },
    ],
  },
  { label: "리포트", href: "/reports" },
  { label: "토픽 분석", href: "/reports/topics" },
]

export function TopNav({ userName = "사용자" }: { userName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(null)
  const [userOpen, setUserOpen] = useState(false)

  const initials = userName ? userName.slice(0, 2) : "—"

  // 경로가 겹치는 메뉴(예: "/reports", "/reports/topics")가 동시에 활성화되지 않도록
  // 가장 길게 일치하는 href를 가진 메뉴만 활성화 처리
  const matchLength = (href?: string) => {
    if (!href) return -1
    if (pathname === href || pathname.startsWith(href + "/")) return href.length
    return -1
  }

  const allHrefs = NAV.flatMap((it) => (it.href ? [it.href] : it.children?.map((c) => c.href) ?? []))
  const bestMatchLength = Math.max(-1, ...allHrefs.map(matchLength))

  const isActive = (href?: string, children?: { href: string }[]) => {
    if (bestMatchLength < 0) return false
    if (href) return matchLength(href) === bestMatchLength
    if (children) return children.some((c) => matchLength(c.href) === bestMatchLength)
    return false
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    router.push("/login")
  }

  const closeAll = () => {
    setOpen(null)
    setUserOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-[64px] w-full max-w-[1040px] items-center justify-between px-6">
        {/* Logo + Nav */}
        <div className="flex items-center gap-9">
          <a href="/dashboard" className="text-[20px] font-extrabold tracking-tight text-slate-900">
            passroute
          </a>
          <nav className="flex items-center gap-1">
            {NAV.map((it) => {
              const active = isActive(it.href, it.children)
              return (
                <div key={it.label} className="relative">
                  {it.children ? (
                    <button
                      onClick={() => { setOpen(open === it.label ? null : it.label); setUserOpen(false) }}
                      className={
                        "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors " +
                        (active
                          ? "text-blue-600"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                      }
                    >
                      {it.label}
                      <ChevronDown
                        size={14}
                        className={"text-slate-400 transition-transform " + (open === it.label ? "rotate-180" : "")}
                      />
                      {active && (
                        <span className="absolute inset-x-3.5 -bottom-[15px] h-0.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ) : (
                    <a
                      href={it.href}
                      className={
                        "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors " +
                        (active
                          ? "text-blue-600"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                      }
                    >
                      {it.label}
                      {active && (
                        <span className="absolute inset-x-3.5 -bottom-[15px] h-0.5 rounded-full bg-blue-600" />
                      )}
                    </a>
                  )}

                  {/* 자료관리 드롭다운 */}
                  {it.children && open === it.label && (
                    <div className="absolute left-0 top-full z-30 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/[0.06]">
                      {it.children.map((c) => (
                        <a
                          key={c.label}
                          href={c.href}
                          onClick={() => setOpen(null)}
                          className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
                        >
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                            <c.icon size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-slate-900">{c.label}</span>
                            <span className="block text-[11px] text-slate-400">{c.desc}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* 유저 버튼 + 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setOpen(null) }}
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 transition-colors hover:bg-slate-50"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              {initials}
            </span>
            <span className="whitespace-nowrap text-sm font-bold text-slate-900">
              {userName || "로딩 중..."}
            </span>
            <ChevronDown
              size={14}
              className={"shrink-0 text-slate-400 transition-transform " + (userOpen ? "rotate-180" : "")}
            />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full z-30 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/[0.06]">
              <a
                href="/settings"
                onClick={() => setUserOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Settings size={15} className="text-slate-400" />
                설정
              </a>
              <button
                onClick={() => { setUserOpen(false); handleLogout() }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50"
              >
                <LogOut size={15} />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 바깥 클릭 시 닫기 */}
      {(open || userOpen) && (
        <div className="fixed inset-0 z-10" onClick={closeAll} />
      )}
    </header>
  )
}
