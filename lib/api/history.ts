import { apiFetch } from "./client"
import type { HistoryListResponse, HistoryDetailResponse, PageResponse } from "@/types/history"
import type { InterviewRoomResponse } from "@/types/interview"

export async function getHistoryList(params?: {
  type?: "TECHNICAL" | "PERSONALITY"
  format?: "ONE_ON_ONE" | "DEBATE"
  page?: number
  size?: number
  sort?: string
}): Promise<PageResponse<HistoryListResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.type) searchParams.set("type", params.type)
  if (params?.format) searchParams.set("format", params.format)
  if (params?.page !== undefined) searchParams.set("page", String(params.page))
  if (params?.size !== undefined) searchParams.set("size", String(params.size))
  if (params?.sort) searchParams.set("sort", params.sort)

  const query = searchParams.toString()
  return apiFetch<PageResponse<HistoryListResponse>>(
    `/api/histories${query ? `?${query}` : ""}`,
    { method: "GET" },
    "면접 기록 조회에 실패했습니다"
  )
}

export async function getHistoryDetail(roomId: number): Promise<HistoryDetailResponse> {
  return apiFetch<HistoryDetailResponse>(
    `/api/histories/${roomId}`,
    { method: "GET" },
    "면접 상세 조회에 실패했습니다"
  )
}

export async function retryInterview(roomId: number): Promise<InterviewRoomResponse> {
  return apiFetch<InterviewRoomResponse>(
    `/api/histories/${roomId}/retry`,
    { method: "POST" },
    "면접 재시도에 실패했습니다"
  )
}

export async function searchHistory(params: {
  keyword: string
  page?: number
  size?: number
}): Promise<PageResponse<HistoryListResponse>> {
  const searchParams = new URLSearchParams()
  searchParams.set("keyword", params.keyword)
  if (params.page !== undefined) searchParams.set("page", String(params.page))
  if (params.size !== undefined) searchParams.set("size", String(params.size))

  return apiFetch<PageResponse<HistoryListResponse>>(
    `/api/histories/search?${searchParams.toString()}`,
    { method: "GET" },
    "면접 기록 검색에 실패했습니다"
  )
}
