/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!backend) return { beforeFiles: [], afterFiles: [] }
    return {
      beforeFiles: [
        // 페이지와 경로가 겹치는 API — Authorization 헤더로 구분
        { source: "/self-intro", destination: `${backend}/api/self-intro`, has: [{ type: "header", key: "authorization" }] },
        { source: "/reports", destination: `${backend}/api/reports`, has: [{ type: "header", key: "authorization" }] },
        { source: "/debate/topics", destination: `${backend}/api/debate/topics`, has: [{ type: "header", key: "authorization" }] },
        { source: "/debate/personas", destination: `${backend}/api/debate/personas`, has: [{ type: "header", key: "authorization" }] },
        { source: "/debate/sessions", destination: `${backend}/api/debate/sessions`, has: [{ type: "header", key: "authorization" }] },
        { source: "/documents", destination: `${backend}/api/documents`, has: [{ type: "header", key: "authorization" }] },
      ],
      afterFiles: [
        // /api/* 는 이미 /api 접두사 포함 — 그대로 전달
        { source: "/api/:path*", destination: `${backend}/api/:path*` },
        { source: "/auth/:path*", destination: `${backend}/api/auth/:path*` },
        { source: "/user/:path*", destination: `${backend}/api/user/:path*` },
        { source: "/documents/:path*", destination: `${backend}/api/documents/:path*` },
        { source: "/interview/:path*", destination: `${backend}/api/interview/:path*` },
        { source: "/self-intro/:path*", destination: `${backend}/api/self-intro/:path*` },
        { source: "/debate/:path*", destination: `${backend}/api/debate/:path*` },
        { source: "/reports/:path*", destination: `${backend}/api/reports/:path*` },
      ],
    }
  },
}

export default nextConfig
