"use client"

import { useState, useCallback } from "react"
import { DarkSidebar } from "@/components/resume-builder/dark-sidebar"
import { DarkMobileHeader } from "@/components/resume-builder/dark-mobile-header"
import { ResumeUploadZone } from "@/components/resume-builder/resume-upload-zone"
import { AnalysisResult } from "@/components/resume-builder/analysis-result"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function ResumeBuilderPage() {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "analyzing" | "complete">("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisData, setAnalysisData] = useState<{
    jobTitle: string
    skills: string[]
    experience: string
    education: string
  } | null>(null)

  const handleFileUpload = useCallback((file: File) => {
    setUploadState("uploading")
    setUploadProgress(0)

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval)
          setUploadState("analyzing")
          
          // Simulate AI analysis
          setTimeout(() => {
            setAnalysisData({
              jobTitle: "Backend Developer",
              skills: ["Python", "Django", "PostgreSQL", "Docker", "AWS", "REST API", "Git"],
              experience: "3년",
              education: "컴퓨터공학 학사",
            })
            setUploadState("complete")
          }, 2500)
          
          return 100
        }
        return prev + 10
      })
    }, 150)
  }, [])

  const handleReset = useCallback(() => {
    setUploadState("idle")
    setUploadProgress(0)
    setAnalysisData(null)
  }, [])

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <DarkSidebar />
      <DarkMobileHeader />

      {/* Main Content */}
      <main className="pt-14 lg:pl-64 lg:pt-0">
        <div className="min-h-screen p-4 lg:p-8">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white lg:text-3xl">
                Upload Your Resume for AI Coaching
              </h1>
              <p className="mt-2 text-slate-400">
                AI가 이력서를 분석하여 맞춤형 면접 코칭을 제공합니다
              </p>
            </div>

            {/* Upload Zone */}
            <ResumeUploadZone
              uploadState={uploadState}
              uploadProgress={uploadProgress}
              onFileUpload={handleFileUpload}
              onReset={handleReset}
            />

            {/* Analysis Result */}
            {uploadState === "complete" && analysisData && (
              <AnalysisResult data={analysisData} />
            )}

            {/* Start Interview Button */}
            {uploadState === "complete" && (
              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  Start Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
