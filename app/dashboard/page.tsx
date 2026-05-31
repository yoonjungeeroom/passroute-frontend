"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { UpcomingSchedule } from "@/components/dashboard/upcoming-schedule"
import { SupportMaterials } from "@/components/dashboard/support-materials"
import { DocumentAssets } from "@/components/dashboard/document-assets"
import { InterviewHistory } from "@/components/dashboard/interview-history"
import { InterviewModal } from "@/components/dashboard/interview-modal"
import { HeroSection } from "@/components/dashboard/hero-section"

function DashboardContent() {
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIntroId, setSelectedIntroId] = useState<number | null>(null)

  const startInterviewId = searchParams?.get("startInterview")
  const prefillData = (startInterviewId ? {
    introId: Number(startInterviewId),
    stage: "technical",
    mode: "one-on-one",
    practiceMode: "practice" as const,
    personas: ["TEAM_LEAD"],
  } : selectedIntroId ? {
    introId: selectedIntroId,
    stage: "technical",
    mode: "one-on-one",
    practiceMode: "practice" as const,
    personas: ["TEAM_LEAD"],
  } : null)

  useEffect(() => {
    if (startInterviewId) {
      setIsModalOpen(true)
    }
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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />

      <main className="pt-14 lg:pl-64 lg:pt-0">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-stagger space-y-6 pb-24">
            <HeroSection onStartInterview={handleStartInterview} />
            <UpcomingSchedule onStartInterview={handleStartInterview} />
            <SupportMaterials onStartInterview={handleStartInterviewWithIntro} />
            <DocumentAssets />
            <InterviewHistory />
          </div>
        </div>
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
