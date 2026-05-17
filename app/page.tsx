"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule"
import { SupportMaterials } from "@/components/dashboard/support-materials"
import { DocumentAssets } from "@/components/dashboard/document-assets"
import { InterviewHistory } from "@/components/dashboard/interview-history"
import { RecommendedPractice } from "@/components/dashboard/recommended-practice"
import { SkillsSummary } from "@/components/dashboard/skills-summary"
import { FloatingActionButton } from "@/components/dashboard/floating-action-button"
import { InterviewModal } from "@/components/dashboard/interview-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Briefcase, Users, Target, HelpCircle, PlayCircle, Settings2 } from "lucide-react"

interface RecentSetup {
  introId: number
  company: string
  role: string
  stage: string
  stageId: string
  mode: string
  practiceMode: "practice" | "real"
  difficulty: string
  questionCount: number
  personas: string[]
}

const recentSetup: RecentSetup = {
  introId: 2,
  company: "카카오",
  role: "AI 엔지니어",
  stage: "기술 면접",
  stageId: "technical",
  mode: "one-on-one",
  practiceMode: "practice",
  difficulty: "중급",
  questionCount: 5,
  personas: ["technical"],
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [continueModalOpen, setContinueModalOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<{
    introId: number
    stage: string
    mode: string
    practiceMode: "practice" | "real"
    personas: string[]
  } | null>(null)

  const handleStartInterview = () => {
    setPrefillData(null)
    setIsModalOpen(true)
  }

  const handleContinueRecent = () => {
    setContinueModalOpen(true)
  }

  const handleContinueWithPrefill = () => {
    setPrefillData({
      introId: recentSetup.introId,
      stage: recentSetup.stageId,
      mode: recentSetup.mode,
      practiceMode: recentSetup.practiceMode,
      personas: recentSetup.personas,
    })
    setContinueModalOpen(false)
    setIsModalOpen(true)
  }

  const handleEditSettings = () => {
    setPrefillData({
      introId: recentSetup.introId,
      stage: recentSetup.stageId,
      mode: recentSetup.mode,
      practiceMode: recentSetup.practiceMode,
      personas: recentSetup.personas,
    })
    setContinueModalOpen(false)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar />
      <MobileHeader />
      
      {/* Main Content */}
      <main className="pt-14 lg:pl-64 lg:pt-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Header */}
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A132F] lg:text-3xl">
              오늘도 면접 연습, 한 걸음 더
            </h1>
            <p className="mt-1.5 text-[#8B7B8B]">
              꾸준한 연습이 합격을 만듭니다. 지금 바로 시작해보세요.
            </p>
          </header>

          <div className="space-y-6 pb-24">
            {/* 1. Upcoming Interview Schedule */}
            <UpcomingSchedule />

            {/* 2. Self Introduction Section */}
            <SupportMaterials />

            {/* 3. Support Materials (Resume / Portfolio) */}
            <DocumentAssets />

            {/* 4. Recent Interview History */}
            <InterviewHistory />

            {/* 5. Recommended Practice */}
            <RecommendedPractice />

            {/* 6. Skills Summary (New) */}
            <SkillsSummary />
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onStartInterview={handleStartInterview}
        onContinueRecent={handleContinueRecent}
      />

      {/* Interview Start Modal */}
      <InterviewModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        prefillData={prefillData}
      />

      {/* Continue Recent Setup Modal */}
      <Dialog open={continueModalOpen} onOpenChange={setContinueModalOpen}>
        <DialogContent className="border-[var(--color-border)] bg-[var(--color-surface)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              최근 면접 설정
            </DialogTitle>
            <DialogDescription className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              이전에 설정한 면접 구성으로 바로 시작하거나 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Setup Info Cards */}
            <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              {/* Company & Role */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-accent)', color: 'white', opacity: 0.2 }}>
                  <Building2 className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div>
                  <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{recentSetup.company}</h4>
                  <p className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <Briefcase className="h-3.5 w-3.5" />
                    {recentSetup.role}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Users className="h-3 w-3" />
                    면접 단계
                  </div>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{recentSetup.stage}</p>
                </div>
                <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Target className="h-3 w-3" />
                    모드
                  </div>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {recentSetup.practiceMode === "practice" ? "연습" : "실전"}
                  </p>
                </div>
                <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <HelpCircle className="h-3 w-3" />
                    난이도
                  </div>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{recentSetup.difficulty}</p>
                </div>
                <div className="rounded-lg border p-2.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <HelpCircle className="h-3 w-3" />
                    질문 수
                  </div>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{recentSetup.questionCount}개</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                onClick={handleEditSettings}
              >
                <Settings2 className="h-4 w-4" />
                설정 수정
              </Button>
              <Button
                className="flex-1 gap-1.5 text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
                onClick={handleContinueWithPrefill}
              >
                <PlayCircle className="h-4 w-4" />
                이어서 시작
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
