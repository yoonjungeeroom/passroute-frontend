import { apiFetch } from "./client"

export interface UserProfile {
  id: number
  email: string
  name: string
  phone: string
  provider: string
  emailVerified: boolean
  phoneVerified: boolean
  experienceYears: number | null
  preferredCompanies: string[]
  preferredJobTypes: string[]
  createdAt: string
}

export interface UserUpdateRequest {
  experienceYears?: number
  preferredJobTypes?: string[]
  preferredCompanies?: string[]
}

export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>(
    "/user/me",
    { method: "GET" },
    "사용자 정보 조회에 실패했습니다"
  )
}

export async function updateUserProfile(data: UserUpdateRequest): Promise<UserProfile> {
  return apiFetch<UserProfile>(
    "/user/me",
    { method: "PATCH", body: JSON.stringify(data) },
    "사용자 정보 수정에 실패했습니다"
  )
}

export async function withdrawUser(password?: string): Promise<void> {
  return apiFetch<void>(
    "/user/me",
    {
      method: "DELETE",
      body: password ? JSON.stringify({ password }) : undefined,
    },
    "회원 탈퇴에 실패했습니다"
  )
}
