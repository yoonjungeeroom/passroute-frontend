import { apiFetch, getAuthHeaders, handleAuthError } from "./client"

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
  const response = await fetch(`/documents?type=${type}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  handleAuthError(response.status)

  if (!response.ok) throw new Error("문서 목록 조회에 실패했습니다")

  const result = await response.json()
  return result.data?.documents ?? []
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
