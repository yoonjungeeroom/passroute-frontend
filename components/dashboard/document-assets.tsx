"use client"

import { useState, useEffect } from "react"
import { FileText, CheckCircle, Clock, Upload, Star, Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  getDocumentList,
  getPresignedUrl,
  completeUpload,
  setRepresentative,
  deleteDocument,
  type DocumentItem,
} from "@/lib/api/documents"

const embedStatusConfig: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  DONE: { label: "분석 완료", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PROCESSING: { label: "분석 중", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200" },
  PENDING: { label: "대기 중", icon: Clock, className: "bg-slate-100 text-slate-500 border-slate-200" },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export function DocumentAssets() {
  const [selectedType, setSelectedType] = useState<"RESUME" | "PORTFOLIO">("RESUME")
  const [files, setFiles] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchFiles()
  }, [selectedType])

  async function fetchFiles() {
    setLoading(true)
    setErrorMessage(null)
    try {
      const data = await getDocumentList(selectedType)
      setFiles(data)
    } catch (error) {
      setFiles([])
      setErrorMessage(error instanceof Error ? error.message : "문서 목록을 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleSetRepresentative = async (documentId: number) => {
    try {
      await setRepresentative(documentId)
      await fetchFiles()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "대표 문서 설정에 실패했습니다.")
    }
  }

  const handleDeleteFile = async (documentId: number) => {
    try {
      await deleteDocument(documentId)
      setFiles(prev => prev.filter(f => f.id !== documentId))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "문서 삭제에 실패했습니다.")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErrorMessage(null)
    try {
      const { presignedUrl, s3Key } = await getPresignedUrl(file.name, selectedType)
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        ...(file.type ? { headers: { "Content-Type": file.type } } : {}),
      })
      if (!uploadResponse.ok) {
        throw new Error(`파일 저장소 업로드에 실패했습니다. (${uploadResponse.status})`)
      }
      await completeUpload({ type: selectedType, s3Key, originalFilename: file.name, fileSize: file.size })
      await fetchFiles()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "파일 업로드에 실패했습니다.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const sortedFiles = [...files].sort((a, b) => {
    if (a.isRepresentative) return -1
    if (b.isRepresentative) return 1
    return 0
  })

  return (
    <section>
      <h3 className="text-[22px] font-extrabold tracking-tight text-slate-900">자료 관리</h3>
      <p className="mt-1 mb-4 text-[13px] text-slate-400">이력서·포트폴리오를 등록하면 면접 질문에 함께 반영돼요</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {(["RESUME", "PORTFOLIO"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition-colors",
                selectedType === type ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700")}
            >
              {type === "RESUME" ? "이력서" : "포트폴리오"}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="mt-5 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">파일 목록</h4>
          <label>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} disabled={uploading} />
            <span className={cn("flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700", uploading && "pointer-events-none opacity-70")}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} strokeWidth={2.2} />}
              {uploading ? "업로드 중..." : "파일 추가"}
            </span>
          </label>
        </div>

        {errorMessage && (
          <div role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* List */}
        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
          ) : sortedFiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
              <FileText size={30} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">업로드된 파일이 없습니다.</p>
            </div>
          ) : (
            sortedFiles.map((file) => {
              const statusConfig = embedStatusConfig[file.embedStatus] ?? embedStatusConfig.PENDING
              const StatusIcon = statusConfig.icon
              return (
                <div key={file.id} className={cn("flex items-center gap-3 rounded-xl border p-3 transition-colors",
                  file.isRepresentative ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-slate-50/40 hover:bg-slate-50")}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400"><FileText size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{file.originalFilename}</p>
                    <p className="text-xs text-slate-400">{formatDate(file.uploadedAt)}</p>
                  </div>
                  <span className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", statusConfig.className)}>
                    <StatusIcon size={11} /> {statusConfig.label}
                  </span>
                  <button
                    onClick={() => handleSetRepresentative(file.id)}
                    title={file.isRepresentative ? "대표 파일" : "대표 파일로 설정"}
                    className={cn("grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-white", file.isRepresentative ? "text-amber-500" : "text-slate-300 hover:text-slate-500")}
                  >
                    <Star size={16} fill={file.isRepresentative ? "currentColor" : "none"} strokeWidth={file.isRepresentative ? 0 : 2} />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"><Trash2 size={16} /></button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>파일 삭제</AlertDialogTitle>
                        <AlertDialogDescription>이 파일을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction className="bg-rose-600 text-white hover:bg-rose-700" onClick={() => handleDeleteFile(file.id)}>삭제</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
