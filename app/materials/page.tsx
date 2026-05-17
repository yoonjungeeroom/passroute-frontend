"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { DocumentAssets } from "@/components/dashboard/document-assets"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function MaterialsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="w-full overflow-auto lg:ml-64">
        <MobileHeader />
        <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" />
            돌아가기
          </Link>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">이력서/포트폴리오</h1>
            <p className="text-muted-foreground">이력서와 포트폴리오 자료를 관리하세요.</p>
          </div>

          <DocumentAssets excludeSelfIntro={true} />
        </div>
      </main>
    </div>
  )
}
