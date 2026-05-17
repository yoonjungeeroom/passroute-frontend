"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Upload, Sparkles, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResumeUploadZoneProps {
  uploadState: "idle" | "uploading" | "analyzing" | "complete"
  uploadProgress: number
  onFileUpload: (file: File) => void
  onReset: () => void
}

export function ResumeUploadZone({
  uploadState,
  uploadProgress,
  onFileUpload,
  onReset,
}: ResumeUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0])
      }
    },
    [onFileUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: uploadState !== "idle",
  })

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="p-6">
        {uploadState === "idle" && (
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
              isDragActive
                ? "border-violet-500 bg-violet-500/10"
                : "border-slate-700 hover:border-violet-500/50 hover:bg-slate-800/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
              <FileText className="h-8 w-8 text-violet-400" />
            </div>
            <p className="mb-2 text-center text-lg font-medium text-white">
              {isDragActive ? "파일을 여기에 놓으세요" : "이력서를 드래그하거나 클릭하여 업로드"}
            </p>
            <p className="mb-4 text-center text-sm text-slate-400">
              PDF, DOCX 파일 지원 (최대 10MB)
            </p>
            <Button className="bg-violet-600 text-white hover:bg-violet-700">
              <Upload className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
          </div>
        )}

        {uploadState === "uploading" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
              <Upload className="h-8 w-8 animate-pulse text-violet-400" />
            </div>
            <p className="mb-4 text-lg font-medium text-white">업로드 중...</p>
            <div className="w-full max-w-md">
              <Progress value={uploadProgress} className="h-2 bg-slate-800" />
            </div>
            <p className="mt-2 text-sm text-slate-400">{uploadProgress}%</p>
          </div>
        )}

        {uploadState === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-2xl bg-violet-600/20" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <p className="mb-2 text-lg font-medium text-white">Analyzing with AI...</p>
            <p className="mb-6 text-sm text-slate-400">이력서를 분석하고 있습니다</p>
            
            {/* Skeleton Loading */}
            <div className="w-full max-w-md space-y-3">
              <div className="h-4 animate-pulse rounded-lg bg-slate-800" style={{ width: "80%" }} />
              <div className="h-4 animate-pulse rounded-lg bg-slate-800" style={{ width: "60%" }} />
              <div className="h-4 animate-pulse rounded-lg bg-slate-800" style={{ width: "70%" }} />
              <div className="flex gap-2">
                <div className="h-6 w-16 animate-pulse rounded-full bg-slate-800" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-800" />
                <div className="h-6 w-14 animate-pulse rounded-full bg-slate-800" />
              </div>
            </div>
          </div>
        )}

        {uploadState === "complete" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600">
              <Check className="h-8 w-8 text-white" />
            </div>
            <p className="mb-2 text-lg font-medium text-white">분석 완료!</p>
            <p className="mb-4 text-sm text-slate-400">아래에서 분석 결과를 확인하세요</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="mr-2 h-4 w-4" />
              다른 이력서 업로드
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
