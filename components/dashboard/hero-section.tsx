"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Mic, ArrowRight, PlayCircle, Building2, Briefcase, Users, Target, HelpCircle, Settings2 } from "lucide-react"

interface HeroSectionProps {
  onStartInterview: () => void
}

interface RecentSetup {
  company: string
  role: string
  stage: string
  mode: "practice" | "real"
  difficulty: string
  questionCount: number
}

const recentSetup: RecentSetup = {
  company: "카카오",
  role: "AI 엔지니어",
  stage: "기술 면접",
  mode: "practice",
  difficulty: "중급",
  questionCount: 5,
}

export function HeroSection({ onStartInterview }: HeroSectionProps) {
  const [continueModalOpen, setContinueModalOpen] = useState(false)

  return (
    <>
      <div className="mb-8">
        {/* Header with greeting */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
            오늘도 면접 연습, 한 걸음 더
          </h1>
          <p className="mt-1.5 text-muted-foreground">
            꾸준한 연습이 합격을 만듭니다. 지금 바로 시작해보세요.
          </p>
        </header>

        {/* CTA Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Primary CTA - Start Interview */}
          <Card 
            className="group relative cursor-pointer overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 to-violet-600/10 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            onClick={onStartInterview}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/25">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-1.5 text-lg font-semibold text-foreground">
                면접 시작하기
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                AI 면접관과 함께 실전처럼 연습하세요
              </p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                새 면접 시작
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>

          {/* Secondary CTA - Continue Recent */}
          <Card 
            className="group cursor-pointer border-border/50 transition-all duration-300 hover:border-primary/30 hover:bg-secondary/30"
            onClick={() => setContinueModalOpen(true)}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <PlayCircle className="h-6 w-6" />
              </div>
              <h3 className="mb-1.5 text-lg font-semibold text-foreground">
                최근 설정 이어서 시작
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {recentSetup.company} - {recentSetup.role} 세트로 바로 시작하기
              </p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground group-hover:text-foreground">
                이어서 시작
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Interview Modal */}
      <Dialog open={continueModalOpen} onOpenChange={setContinueModalOpen}>
        <DialogContent className="border-border/50 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              최근 면접 설정
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              이전에 설정한 면접 구성으로 바로 시작하거나 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Setup Info Cards */}
            <div className="space-y-3 rounded-xl border border-border/50 bg-secondary/30 p-4">
              {/* Company & Role */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{recentSetup.company}</h4>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    {recentSetup.role}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border border-border/30 bg-secondary/50 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    면접 단계
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{recentSetup.stage}</p>
                </div>
                <div className="rounded-lg border border-border/30 bg-secondary/50 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" />
                    모드
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {recentSetup.mode === "practice" ? "연습" : "실전"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/30 bg-secondary/50 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HelpCircle className="h-3 w-3" />
                    난이도
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{recentSetup.difficulty}</p>
                </div>
                <div className="rounded-lg border border-border/30 bg-secondary/50 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HelpCircle className="h-3 w-3" />
                    질문 수
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{recentSetup.questionCount}개</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 border-border/50"
                onClick={() => {
                  setContinueModalOpen(false)
                  onStartInterview()
                }}
              >
                <Settings2 className="h-4 w-4" />
                설정 수정
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-gradient-to-r from-primary to-violet-600 text-white hover:opacity-90"
                onClick={() => setContinueModalOpen(false)}
              >
                <PlayCircle className="h-4 w-4" />
                이어서 시작
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
