import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { config } from "@fortawesome/fontawesome-svg-core"
import "@fortawesome/fontawesome-svg-core/styles.css"
import '@/lib/fontawesome'
import './globals.css'

config.autoAddCss = false

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'passroute - AI 면접 코칭 플랫폼',
  description: 'AI 기반 실시간 면접 분석 플랫폼. 개인 맞춤형 질문 생성과 멀티모달 분석으로 실전 면접 대응 능력을 향상시키세요.',
  generator: 'v0.app',
  icons: {
    icon: '/passroute.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
