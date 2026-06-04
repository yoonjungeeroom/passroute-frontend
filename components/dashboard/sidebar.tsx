"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronDown, Settings, LogOut } from "lucide-react"
import { menuItems } from "@/lib/navigation-config"
import { getUserProfile, type UserProfile } from "@/lib/api/user"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>(["자료 관리"])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    router.push("/login")
  }

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      getUserProfile().then(setUser).catch(() => {})
    }
  }, [])

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

  const visibleItems = menuItems.filter(item => !item.mobileOnly)

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border/40 bg-white lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="text-2xl font-bold text-foreground transition-opacity hover:opacity-80">
          passroute
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {visibleItems.map((item) => {
          const isExpanded = expandedItems.includes(item.label)
          const hasActiveChild = isChildActive(item.children)
          const itemActive = isActive(item.href) || hasActiveChild

          if (item.expandable && item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    hasActiveChild
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4.5 w-4.5" />
                    {item.label}
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isExpanded && "rotate-180"
                  )} />
                </button>
                <div className={cn(
                  "ml-4 mt-0.5 space-y-0.5 overflow-hidden transition-all duration-300",
                  isExpanded ? "max-h-40 opacity-100 pl-4" : "max-h-0 opacity-0 pl-4"
                )}>
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        isActive(child.href)
                          ? "bg-primary/8 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <child.icon className="h-4 w-4" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <Link
              key={item.href || item.label}
              href={item.href || "/dashboard"}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                itemActive
                  ? "bg-primary/8 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border/40 p-3">
        <button
          onClick={() => setProfileOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/50"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={undefined} alt={user?.name} />
            <AvatarFallback className="bg-primary text-xs font-medium text-white">
              {user?.name?.slice(0, 2) ?? "—"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-foreground">
              {user?.name ?? "—"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email ?? ""}
            </span>
          </div>
        </button>
      </div>

      {/* Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>내 프로필</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3 py-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={undefined} alt={user?.name} />
              <AvatarFallback className="bg-primary text-sm font-medium text-white">
                {user?.name?.slice(0, 2) ?? "—"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-base font-semibold text-foreground">
                {user?.name ?? "—"}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {user?.email ?? ""}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                setProfileOpen(false)
                router.push("/settings")
              }}
            >
              <Settings className="h-4 w-4" />
              설정
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
