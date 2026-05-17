"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Mic, PlayCircle, Plus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingActionButtonProps {
  onStartInterview: () => void
  onContinueRecent: () => void
}

export function FloatingActionButton({ onStartInterview, onContinueRecent }: FloatingActionButtonProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleNewInterview = () => {
    setIsSheetOpen(false)
    onStartInterview()
  }

  const handleContinue = () => {
    setIsSheetOpen(false)
    onContinueRecent()
  }

  return (
    <>
      {/* Floating Button - Large primary action */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 lg:bottom-8">
        <Button
          onClick={() => setIsSheetOpen(true)}
          className={cn(
            "h-24 w-24 rounded-full",
            "bg-[var(--color-primary)]",
            "shadow-lg shadow-[var(--color-primary)]/30",
            "transition-all duration-300",
            "hover:scale-110 hover:shadow-lg hover:shadow-[var(--color-primary)]/40",
            "active:scale-95"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <Sparkles className="h-8 w-8 text-white" />
            <span className="text-sm font-bold text-white">시작</span>
          </div>
        </Button>
      </div>

      {/* Bottom Action Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-[var(--color-border)] bg-white px-6 pb-10 pt-6">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center text-lg font-semibold text-[var(--color-text)]">
              면접 시작하기
            </SheetTitle>
            <SheetDescription className="text-center text-sm text-[var(--color-text-muted)]">
              AI 면접관과 함께 연습해보세요
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            {/* New Interview */}
            <button
              onClick={handleNewInterview}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border border-[var(--color-border)] p-4",
                "bg-white transition-all duration-200",
                "hover:border-[var(--color-accent)] hover:bg-blue-50"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[var(--color-text)]">새 면접 시작</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  자기소개서와 면접 설정을 선택하세요
                </p>
              </div>
            </button>

            {/* Continue Recent */}
            <button
              onClick={handleContinue}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border border-[var(--color-border)] p-4",
                "bg-white transition-all duration-200",
                "hover:border-[var(--color-accent)] hover:bg-blue-50"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-accent)]">
                <PlayCircle className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[var(--color-text)]">최근 설정 이어서 시작</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  카카오 - AI 엔지니어 세트로 바로 시작
                </p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
