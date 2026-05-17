"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

const menuItems = [
  {
    label: "Mock Interviews",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Custom Interviews",
    href: "/custom",
    icon: Users,
  },
  {
    label: "Results",
    href: "/results",
    icon: BarChart3,
  },
  {
    label: "AI Resume Builder",
    href: "/resume-builder",
    icon: FileText,
    badge: "New",
  },
  {
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
]

const user = {
  name: "이진영",
  email: "ljy9350@dgu.ac.kr",
  avatar: null,
}

export function DarkSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-slate-800 bg-[#0F172A] lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">Huru</span>
      </div>

      {/* User Profile Top */}
      <div className="border-b border-slate-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback className="bg-violet-600/20 text-violet-400 text-sm font-medium">
              {user.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs text-slate-400">Welcome</span>
            <span className="truncate text-sm font-medium text-white">
              {user.name}
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm font-medium text-violet-400">{"Let's Practice"}</p>
      </div>

      {/* Navigation */}
      <div className="px-4 py-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Main Menu
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-600/20 text-violet-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              {item.badge && (
                <Badge className="bg-violet-600 text-white text-[10px] px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 rounded-lg bg-slate-800/50 px-3 py-2">
          <p className="text-xs text-slate-400">Free Trial</p>
          <p className="text-sm font-medium text-white">English</p>
        </div>
        <p className="mb-2 truncate text-xs text-slate-500">{user.email}</p>
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <button className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
          Join Affiliate Program
        </button>
      </div>
    </aside>
  )
}
