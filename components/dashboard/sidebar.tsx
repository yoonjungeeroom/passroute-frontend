"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Calendar,
  FolderOpen,
  FileText,
  Briefcase,
  FileBarChart,
  Settings,
  Sparkles,
  ChevronDown,
} from "lucide-react"

const menuItems = [
  {
    label: "대시보드",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "면접 일정 관리",
    href: "/schedule",
    icon: Calendar,
  },
  {
    label: "자료 관리",
    href: null,
    icon: FolderOpen,
    expandable: true,
    children: [
      { label: "자기소개서", href: "/self-intro", icon: FileText },
      { label: "이력서/포트폴리오", href: "/materials", icon: Briefcase },
    ],
  },
  {
    label: "리포트",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    label: "설정",
    href: "/settings",
    icon: Settings,
  },
]

const user = {
  name: "김지민",
  email: "jimin.kim@email.com",
  avatar: null,
}

export function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(["자료 관리"])

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isActive = (href: string | null) => {
    if (!href) return false
    return pathname === href
  }

  const isChildActive = (children?: { href: string }[]) => {
    if (!children) return false
    return children.some(child => pathname === child.href)
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col lg:flex" style={{ borderRight: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-border)] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]">
          <Sparkles className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">InterviewAI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const isExpanded = expandedItems.includes(item.label)
          const hasActiveChild = isChildActive(item.children)
          const itemActive = isActive(item.href) || hasActiveChild

          if (item.expandable && item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    hasActiveChild
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-4.5 w-4.5", hasActiveChild && "text-white")} />
                    {item.label}
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )} />
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-[var(--color-border)] pl-4">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                          isActive(child.href)
                            ? "bg-[var(--color-primary)] text-white"
                            : "text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                        )}
                      >
                        <child.icon className={cn("h-4 w-4", isActive(child.href) && "text-white")} />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href || item.label}
              href={item.href || "/"}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                itemActive
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5", itemActive && "text-white")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-[var(--color-border)] p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--color-bg)]">
          <Avatar className="h-9 w-9 ring-2 ring-[var(--color-border)]">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback className="bg-[var(--color-primary)]/10 text-xs font-medium text-[var(--color-text)]">
              {user.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-[var(--color-text)]">
              {user.name}
            </span>
            <span className="truncate text-xs text-[var(--color-text-muted)]">
              {user.email}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
