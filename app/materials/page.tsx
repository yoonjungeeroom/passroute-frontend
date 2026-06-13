"use client"

import { useState, useEffect } from "react"
import { TopNav } from "@/components/dashboard/top-nav"
import { DocumentAssets } from "@/components/dashboard/document-assets"
import { getUserProfile } from "@/lib/api/user"

export default function MaterialsPage() {
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (token) {
      getUserProfile()
        .then((u) => setUserName(u.name))
        .catch(() => {})
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <TopNav userName={userName} />
      <main className="mx-auto w-full max-w-[1040px] px-6 py-9">
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">이력서/포트폴리오</h1>
          <p className="mt-1 text-sm text-slate-500">이력서와 포트폴리오 자료를 관리하세요.</p>
        </div>
        <DocumentAssets />
      </main>
    </div>
  )
}
