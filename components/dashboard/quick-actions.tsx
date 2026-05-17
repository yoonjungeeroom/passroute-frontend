"use client"

import { Button } from "@/components/ui/button"
import { UserRound, Users } from "lucide-react"

export function QuickActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        className="h-12 gap-2.5 px-6 text-base font-medium"
      >
        <UserRound className="h-5 w-5" />
        1:1 면접 시작
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="h-12 gap-2.5 px-6 text-base font-medium"
      >
        <Users className="h-5 w-5" />
        그룹 면접 시작
      </Button>
    </div>
  )
}
