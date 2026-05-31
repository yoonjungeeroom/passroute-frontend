"use client"

import { useState, useEffect } from "react"
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
import { Menu, ChevronDown } from "lucide-react"
import { menuItems } from "@/lib/navigation-config"
import { getUserProfile, type UserProfile } from "@/lib/api/user"

export function MobileHeader() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(["자료 관리"])
  const [user, setUser] = useState<UserProfile | null>(null)

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

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-card/95 px-4 backdrop-blur-sm lg:hidden">
      {/* Logo */}
      <div className="flex items-center">
        <span className="text-xl font-bold text-foreground">passroute</span>
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
            <SheetTitle className="text-left">
              <span className="text-lg font-bold text-foreground">passroute</span>
            </SheetTitle>
            <SheetDescription className="sr-only">
              메뉴
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
                  href={item.href || "/dashboard"}
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
                <AvatarImage src={undefined} alt={user?.name} />
                <AvatarFallback className="bg-primary/20 text-xs font-medium text-foreground">
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
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
