"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, FolderOpen, CheckCircle, Clock, Upload, Star, Trash2, Loader2 } from "lucide-react"
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
  DONE: {
    label: "분석 완료",
    icon: CheckCircle,
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  PROCESSING: {
    label: "분석 중",
    icon: Clock,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  PENDING: {
    label: "대기 중",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
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

  useEffect(() => {
    fetchFiles()
  }, [selectedType])

  async function fetchFiles() {
    setLoading(true)
    try {
      const data = await getDocumentList(selectedType)
      setFiles(data)
    } catch {
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleSetRepresentative = async (documentId: number) => {
    try {
      await setRepresentative(documentId)
      await fetchFiles()
    } catch {
      // 실패
    }
  }

  const handleDeleteFile = async (documentId: number) => {
    try {
      await deleteDocument(documentId)
      setFiles(prev => prev.filter(f => f.id !== documentId))
    } catch {
      // 실패
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { presignedUrl, s3Key } = await getPresignedUrl(file.name, selectedType)

      await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      await completeUpload({
        type: selectedType,
        s3Key,
        originalFilename: file.name,
        fileSize: file.size,
      })

      await fetchFiles()
    } catch {
      // 업로드 실패
    } finally {
      setUploading(false)
    }
  }

  const sortedFiles = [...files].sort((a, b) => {
    if (a.isRepresentative) return -1
    if (b.isRepresentative) return 1
    return 0
  })

  return (
    <Card className="border-border bg-white rounded-xl">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <FolderOpen className="h-4.5 w-4.5 text-muted-foreground" />
          자료 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {(["RESUME", "PORTFOLIO"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                selectedType === type
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {type === "RESUME" ? "이력서" : "포트폴리오"}
            </button>
          ))}
        </div>

        {/* File List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">파일 목록</h3>
            <label>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? "업로드 중..." : "파일 추가"}
                </span>
              </Button>
            </label>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedFiles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">업로드된 파일이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFiles.map((file) => {
                const statusConfig = embedStatusConfig[file.embedStatus] ?? embedStatusConfig.PENDING
                const StatusIcon = statusConfig.icon

                return (
                  <div
                    key={file.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 transition-all",
                      file.isRepresentative
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-border bg-secondary/20 hover:bg-secondary/30"
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{file.originalFilename}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(file.uploadedAt)}</p>
                    </div>

                    <Badge variant="outline" className={statusConfig.className}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusConfig.label}
                    </Badge>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn("h-8 w-8 p-0 hover:bg-secondary", file.isRepresentative && "text-amber-500")}
                        onClick={() => handleSetRepresentative(file.id)}
                        title={file.isRepresentative ? "대표 파일" : "대표 파일로 설정"}
                      >
                        <Star className="h-4 w-4" fill={file.isRepresentative ? "currentColor" : "none"} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-border bg-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle>파일 삭제</AlertDialogTitle>
                            <AlertDialogDescription>이 파일을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => handleDeleteFile(file.id)}>삭제</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
