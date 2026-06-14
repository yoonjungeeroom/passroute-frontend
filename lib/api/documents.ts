import { apiFetch } from "./client"

export interface DocumentItem {
  id: number
  originalFilename: string
  s3Url: string
  isRepresentative: boolean
  embedStatus: string
  fileExt: string
  fileSize: number
  uploadedAt: string
}

export interface PresignedUrlResponse {
  presignedUrl: string
  s3Key: string
}

export async function getPresignedUrl(filename: string, type: "RESUME" | "PORTFOLIO"): Promise<PresignedUrlResponse> {
  return apiFetch<PresignedUrlResponse>(
    `/documents/presigned-url?filename=${encodeURIComponent(filename)}&type=${type}`,
    { method: "GET" },
    "업로드 URL 생성에 실패했습니다"
  )
}

export async function completeUpload(data: {
  type: "RESUME" | "PORTFOLIO"
  s3Key: string
  originalFilename: string
  fileSize: number
}): Promise<void> {
  return apiFetch<void>(
    "/documents/upload-complete",
    { method: "POST", body: JSON.stringify(data) },
    "업로드 완료 처리에 실패했습니다"
  )
}

export async function getDocumentList(type: "RESUME" | "PORTFOLIO"): Promise<DocumentItem[]> {
  const result = await apiFetch<{ documents: DocumentItem[] }>(
    `/documents?type=${type}`,
    { method: "GET" },
    "문서 목록 조회에 실패했습니다"
  )
  return result.documents ?? []
}

export async function setRepresentative(documentId: number): Promise<void> {
  return apiFetch<void>(
    `/documents/${documentId}/representative`,
    { method: "PATCH" },
    "대표 문서 설정에 실패했습니다"
  )
}

export async function deleteDocument(documentId: number): Promise<void> {
  return apiFetch<void>(
    `/documents/${documentId}`,
    { method: "DELETE" },
    "문서 삭제에 실패했습니다"
  )
}
