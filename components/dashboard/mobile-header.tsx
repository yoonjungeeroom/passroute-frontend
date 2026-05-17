"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Calendar,
  FolderOpen,
  FileText,
  Briefcase,
  History,
  FileBarChart,
  Settings,
  Sparkles,
  Menu,
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
      { label: "이력서", href: "/documents/resume", icon: FileText },
      { label: "포트폴리오", href: "/documents/portfolio", icon: Briefcase },
    ],
  },
  {
    label: "면접 이력",
    href: "/history",
    icon: History,
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

export function MobileHeader() {
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
    <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-card/95 px-4 backdrop-blur-sm lg:hidden">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-foreground">InterviewAI</span>
      </div>

      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-border/50 bg-card p-0">
          <SheetHeader className="border-b border-border/50 px-4 py-4">
            <SheetTitle className="flex items-center gap-2.5 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-lg font-semibold text-foreground">InterviewAI</span>
            </SheetTitle>
            <SheetDescription className="sr-only">
              AI 면접 분석 플랫폼 메뉴
            </SheetDescription>
          </SheetHeader>

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
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("h-4.5 w-4.5", hasActiveChild && "text-primary")} />
                        {item.label}
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-border/50 pl-4">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                              isActive(child.href)
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                          >
                            <child.icon className={cn("h-4 w-4", isActive(child.href) && "text-primary")} />
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
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4.5 w-4.5", itemActive && "text-primary")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 p-4">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <Avatar className="h-9 w-9 ring-2 ring-border/50">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-600/20 text-xs font-medium text-foreground">
                  {user.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-foreground">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
