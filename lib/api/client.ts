import type { ApiResponse } from "@/lib/auth-config"

export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null
let isRedirecting = false

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (isRedirecting) return false

  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) return false

  if (isRefreshing && refreshPromise) return refreshPromise

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const response = await fetch("/auth/reissue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) return false

      const result = await response.json()
      if (result.data?.accessToken) {
        localStorage.setItem("accessToken", result.data.accessToken)
        if (result.data.refreshToken) {
          localStorage.setItem("refreshToken", result.data.refreshToken)
        }
        return true
      }
      return false
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function redirectToLogin() {
  if (typeof window === "undefined" || isRedirecting) return
  isRedirecting = true
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  window.location.href = "/login"
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  errorMessage = "요청에 실패했습니다"
): Promise<T> {
  if (isRedirecting) throw new Error("인증이 만료되었습니다")

  // 인증이 필요한 요청인데 토큰이 없으면 바로 로그인으로
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  const isAuthRoute = url.startsWith("/auth/")
  if (!token && !isAuthRoute) {
    redirectToLogin()
    throw new Error("인증이 만료되었습니다")
  }

  let response = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  })

  if (response.status === 401 && !isAuthRoute) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: { ...getAuthHeaders(), ...options.headers },
      })
    } else {
      redirectToLogin()
      throw new Error("인증이 만료되었습니다")
    }
  }

  if (options.method === "DELETE" && response.ok) {
    return undefined as T
  }

  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    if (response.ok) return undefined as T
    throw new Error(errorMessage)
  }

  const result: ApiResponse<T> = await response.json()
  if (!response.ok) {
    throw new Error(result.message || errorMessage)
  }
  return result.data as T
}

export function handleAuthError(status: number) {
  if (status === 401 && !isRedirecting) {
    tryRefreshToken().then(refreshed => {
      if (!refreshed) redirectToLogin()
    })
  }
}
