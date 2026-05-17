"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  Users,
  FileText,
  BarChart3,
  CreditCard,
  LogOut,
  Menu,
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

export function DarkMobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-slate-800 bg-[#0F172A] px-4 lg:hidden">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-white">Huru</span>
      </div>

      {/* Menu Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-800 hover:text-white">
            <Menu className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-slate-800 bg-[#0F172A] p-0">
          <SheetHeader className="border-b border-slate-800 px-4 py-4">
            <SheetTitle className="flex items-center gap-2.5 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Huru</span>
            </SheetTitle>
            <SheetDescription className="sr-only">
              AI Interview Prep 메뉴
            </SheetDescription>
          </SheetHeader>

          {/* User Profile */}
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
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-4">
            <p className="mb-2 truncate text-xs text-slate-500">{user.email}</p>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
