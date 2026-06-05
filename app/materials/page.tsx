"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { DocumentAssets } from "@/components/dashboard/document-assets"

export default function MaterialsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="w-full overflow-auto pt-14 lg:ml-64 lg:pt-0">
        <MobileHeader />
        <div className="sticky top-14 z-30 border-b border-border/30 bg-background/95 backdrop-blur-sm lg:top-0">
          <div className="px-4 pt-8 pb-5 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">이력서/포트폴리오</h1>
            <p className="text-sm text-muted-foreground mt-1">이력서와 포트폴리오 자료를 관리하세요.</p>
          </div>
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <DocumentAssets />
        </div>
      </main>
    </div>
  )
}
