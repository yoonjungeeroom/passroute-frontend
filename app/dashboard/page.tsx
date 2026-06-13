"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { TopNav } from "@/components/dashboard/top-nav"
import { HeroSection } from "@/components/dashboard/hero-section"
import { InterviewStats } from "@/components/dashboard/interview-stats"
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule"
import { SupportMaterials } from "@/components/dashboard/support-materials"
import { DocumentAssets } from "@/components/dashboard/document-assets"
import { WhyPassroute } from "@/components/dashboard/why-passroute"
import { ModeGuide } from "@/components/dashboard/mode-guide"
import { InterviewHistory } from "@/components/dashboard/interview-history"
import { InterviewModal } from "@/components/dashboard/interview-modal"
import { getUserProfile } from "@/lib/api/user"

function DashboardContent() {
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIntroId, setSelectedIntroId] = useState<number | null>(null)
  const [userName, setUserName] = useState("")

  // 로그인 사용자 이름 API에서 가져오기
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      getUserProfile()
        .then((u) => setUserName(u.name))
        .catch(() => {})
    }
  }, [])

  const startInterviewId = searchParams?.get("startInterview")
  const prefillData = startInterviewId
    ? {
        introId: Number(startInterviewId),
        stage: "technical",
        mode: "one-on-one",
        practiceMode: "practice" as const,
        personas: ["TEAM_LEAD"],
      }
    : selectedIntroId
    ? {
        introId: selectedIntroId,
        stage: "technical",
        mode: "one-on-one",
        practiceMode: "practice" as const,
        personas: ["TEAM_LEAD"],
      }
    : null

  useEffect(() => {
    if (startInterviewId) setIsModalOpen(true)
  }, [startInterviewId])

  const handleStartInterview = () => {
    setSelectedIntroId(null)
    setIsModalOpen(true)
  }

  const handleStartInterviewWithIntro = (introId: number) => {
    setSelectedIntroId(introId)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <TopNav userName={userName} />

      <main className="mx-auto w-full max-w-[1040px] space-y-11 px-6 py-9">
        <HeroSection userName={userName} onStartInterview={handleStartInterview} />
        <InterviewStats />
        <UpcomingSchedule onStartInterview={handleStartInterview} />
        <SupportMaterials onStartInterview={handleStartInterviewWithIntro} />
        <DocumentAssets />
        <WhyPassroute />
        <ModeGuide />
        <InterviewHistory />
      </main>

      <InterviewModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        prefillData={prefillData}
      />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
