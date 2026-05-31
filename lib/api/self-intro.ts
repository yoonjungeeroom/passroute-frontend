import { apiFetch } from "./client"

export interface SelfIntroItem {
  id: number
  questionText: string
  answerText: string
  orderNum: number
}

export interface SelfIntroResponse {
  id: number
  companyName: string
  jobPosition: string
  careerLevel: "INTERN" | "JUNIOR" | "SENIOR"
  jobDescription: string | null
  jobPostingUrl: string | null
  memo: string | null
  interviewDate: string | null
  interviewTime: string | null
  interviewStage: string | null
  itemCount: number
  items: SelfIntroItem[]
  version: number
  createdAt: string
  updatedAt: string
}

export interface SelfIntroCreateRequest {
  companyName: string
  jobPosition: string
  careerLevel: "INTERN" | "JUNIOR" | "SENIOR"
  jobDescription?: string
  jobPostingUrl?: string
  memo?: string
  interviewDate?: string
  interviewTime?: string
  interviewStage?: string
  items?: { questionText: string; answerText?: string }[]
}

export interface SelfIntroUpdateRequest {
  companyName: string
  jobPosition: string
  careerLevel: "INTERN" | "JUNIOR" | "SENIOR"
  jobDescription?: string
  jobPostingUrl?: string
  memo?: string
  interviewDate?: string
  interviewTime?: string
  interviewStage?: string
  items?: { questionText: string; answerText?: string }[]
}

async function selfIntroFetch<T>(url: string, options: RequestInit = {}, errorMessage: string): Promise<T> {
  return apiFetch<T>(url, options, errorMessage)
}

export async function getSelfIntroList(filter?: string): Promise<SelfIntroResponse[]> {
  const query = filter && filter !== "all" ? `?filter=${filter}` : ""
  return selfIntroFetch<SelfIntroResponse[]>(
    `/self-intro${query}`,
    { method: "GET" },
    "자기소개서 목록 조회에 실패했습니다"
  )
}

export async function getSelfIntroDetail(id: number): Promise<SelfIntroResponse> {
  return selfIntroFetch<SelfIntroResponse>(
    `/self-intro/${id}`,
    { method: "GET" },
    "자기소개서 조회에 실패했습니다"
  )
}

export async function createSelfIntro(data: SelfIntroCreateRequest): Promise<SelfIntroResponse> {
  return selfIntroFetch<SelfIntroResponse>(
    "/self-intro",
    { method: "POST", body: JSON.stringify(data) },
    "자기소개서 생성에 실패했습니다"
  )
}

export async function updateSelfIntro(id: number, data: SelfIntroUpdateRequest): Promise<SelfIntroResponse> {
  return selfIntroFetch<SelfIntroResponse>(
    `/self-intro/${id}`,
    { method: "PUT", body: JSON.stringify(data) },
    "자기소개서 수정에 실패했습니다"
  )
}

export async function deleteSelfIntro(id: number): Promise<void> {
  return selfIntroFetch<void>(
    `/self-intro/${id}`,
    { method: "DELETE" },
    "자기소개서 삭제에 실패했습니다"
  )
}
