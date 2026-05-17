"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, FolderOpen, CheckCircle, Clock, Upload, Star, Trash2, Pencil, X, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DocumentAsset {
  id: string
  type: "resume" | "portfolio" | "self-intro"
  label: string
  fileCount: number
  lastUpdated: string
  analysisStatus: "analyzed" | "pending" | "none"
  representativeFile?: string
  color: "blue" | "violet" | "emerald"
}

interface DocumentFile {
  id: string
  name: string
  updatedAt: string
  analysisStatus: "analyzed" | "pending" | "none"
  isRepresentative: boolean
  type: "resume" | "portfolio" | "self-intro"
}

const documentAssets: DocumentAsset[] = [
  {
    id: "resume",
    type: "resume",
    label: "이력서",
    fileCount: 3,
    lastUpdated: "2026.03.28",
    analysisStatus: "analyzed",
    representativeFile: "네이버_백엔드_이력서.pdf",
    color: "blue",
  },
  {
    id: "portfolio",
    type: "portfolio",
    label: "포트폴리오",
    fileCount: 2,
    lastUpdated: "2026.03.25",
    analysisStatus: "pending",
    representativeFile: "포트폴리오_2026.pdf",
    color: "violet",
  },
  {
    id: "self-intro",
    type: "self-intro",
    label: "자기소개서",
    fileCount: 2,
    lastUpdated: "2026.03.20",
    analysisStatus: "none",
    representativeFile: "카카오_자기소개서.pdf",
    color: "emerald",
  },
]

const allFiles: DocumentFile[] = [
  { id: "r1", name: "네이버_백엔드_이력서.pdf", updatedAt: "2026.03.28", analysisStatus: "analyzed", isRepresentative: true, type: "resume" },
  { id: "r2", name: "카카오_AI엔지니어_이력서.pdf", updatedAt: "2026.03.25", analysisStatus: "analyzed", isRepresentative: false, type: "resume" },
  { id: "r3", name: "삼성_SW개발자_이력서.pdf", updatedAt: "2026.03.20", analysisStatus: "pending", isRepresentative: false, type: "resume" },
  { id: "p1", name: "포트폴리오_2026.pdf", updatedAt: "2026.03.25", analysisStatus: "pending", isRepresentative: true, type: "portfolio" },
  { id: "p2", name: "프로젝트_모음.pdf", updatedAt: "2026.03.15", analysisStatus: "none", isRepresentative: false, type: "portfolio" },
  { id: "s1", name: "카카오_자기소개서.pdf", updatedAt: "2026.03.20", analysisStatus: "none", isRepresentative: true, type: "self-intro" },
  { id: "s2", name: "네이버_자기소개서.pdf", updatedAt: "2026.03.10", analysisStatus: "none", isRepresentative: false, type: "self-intro" },
]

const analysisStatusConfig = {
  analyzed: {
    label: "분석 완료",
    icon: CheckCircle,
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  pending: {
    label: "분석 중",
    icon: Clock,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  none: {
    label: "미분석",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
}

export function DocumentAssets({ excludeSelfIntro = false }: { excludeSelfIntro?: boolean }) {
  const [files, setFiles] = useState<DocumentFile[]>(allFiles.filter(f => !excludeSelfIntro || f.type !== "self-intro"))
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingFileName, setEditingFileName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedType, setSelectedType] = useState<"resume" | "portfolio" | "self-intro" | null>(
    excludeSelfIntro ? "resume" : null
  )

  const visibleAssets = excludeSelfIntro 
    ? documentAssets.filter(a => a.type !== "self-intro")
    : documentAssets

  const handleSetRepresentative = (fileId: string) => {
    setFiles(prev =>
      prev.map(f => ({
        ...f,
        isRepresentative: f.id === fileId
      }))
    )
  }

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleEditFileName = (fileId: string, currentName: string) => {
    setEditingFileId(fileId)
    setEditingFileName(currentName)
  }

  const handleSaveFileName = () => {
    if (!editingFileId || !editingFileName.trim()) return
    setFiles(prev =>
      prev.map(f =>
        f.id === editingFileId ? { ...f, name: editingFileName } : f
      )
    )
    setEditingFileId(null)
    setEditingFileName("")
  }

  const handleCancelEdit = () => {
    setEditingFileId(null)
    setEditingFileName("")
  }

  const getFilesByType = (type: "resume" | "portfolio" | "self-intro") => {
    return files.filter(f => f.type === type).sort((a, b) => {
      if (a.isRepresentative) return -1
      if (b.isRepresentative) return 1
      return 0
    })
  }

  const handleFileUpload = (type: "resume" | "portfolio" | "self-intro") => {
    setIsUploading(true)
    setUploadProgress(0)
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            const newFile: DocumentFile = {
              id: `new-${Date.now()}`,
              name: `새파일_${new Date().toISOString().slice(0,10)}.pdf`,
              updatedAt: new Date().toLocaleDateString('ko-KR').replace(/\. /g, '.').slice(0,-1),
              analysisStatus: "pending",
              isRepresentative: false,
              type: type
            }
            setFiles(prev => [...prev, newFile])
            setIsUploading(false)
            setUploadProgress(0)
          }, 500)
          return 100
        }
        return prev + 10
      })
    }, 150)
  }

  return (
    <>
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <FolderOpen className="h-4.5 w-4.5 text-primary" />
            자료 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {documentAssets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-lg border border-border/50 bg-secondary/30 p-4"
              >
                <div className="text-sm text-muted-foreground mb-1">{asset.label}</div>
                <div className="text-2xl font-bold text-foreground">{asset.fileCount}</div>
                <div className="text-xs text-muted-foreground mt-2">마지막: {asset.lastUpdated}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border/50">
            {documentAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelectedType(asset.type)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                  selectedType === asset.type
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {asset.label}
              </button>
            ))}
          </div>

          {/* File List */}
          {selectedType && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">파일 목록</h3>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  style={{ backgroundColor: "#61A4BC" }}
                  onClick={() => handleFileUpload(selectedType)}
                >
                  <Upload className="h-3.5 w-3.5" />
                  파일 추가
                </Button>
              </div>

              {isUploading && (
                <div className="w-full rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                      <Upload className="h-5 w-5 text-primary animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">업로드 중...</p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div 
                          className="h-full bg-primary transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{uploadProgress}% 완료</p>
                    </div>
                  </div>
                </div>
              )}

              {getFilesByType(selectedType).length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 bg-secondary/20 p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">업로드된 파일이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilesByType(selectedType).map((file) => {
                    const statusConfig = analysisStatusConfig[file.analysisStatus]
                    const StatusIcon = statusConfig.icon

                    return (
                      <div
                        key={file.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 transition-all",
                          file.isRepresentative 
                            ? "border-amber-500/30 bg-amber-500/5" 
                            : "border-border/50 bg-secondary/20 hover:bg-secondary/30"
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                          <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          {editingFileId === file.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingFileName}
                                onChange={(e) => setEditingFileName(e.target.value)}
                                className="h-8 border-border/50 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveFileName()
                                  if (e.key === "Escape") handleCancelEdit()
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={handleSaveFileName}
                              >
                                <Check className="h-4 w-4 text-emerald-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4 text-rose-400" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-foreground">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.updatedAt}</p>
                            </div>
                          )}
                        </div>

                        <Badge variant="outline" className={statusConfig.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>

                        {file.isRepresentative && (
                          <Star className="h-4 w-4 text-amber-400" />
                        )}

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-secondary"
                            onClick={() => handleSetRepresentative(file.id)}
                            title="대표 파일로 설정"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-secondary"
                            onClick={() => handleEditFileName(file.id, file.name)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
