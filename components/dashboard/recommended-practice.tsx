"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, ArrowRight, Target, MessageSquare, AlertTriangle, Sparkles } from "lucide-react"

interface PracticeItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
  duration: string
}

const practiceItems: PracticeItem[] = [
  {
    id: "1",
    title: "STAR 구조 연습",
    description: "상황-과제-행동-결과 구조로 경험을 체계적으로 정리하는 연습",
    icon: Target,
    iconColor: "bg-blue-500/20 text-blue-400",
    duration: "10분",
  },
  {
    id: "2",
    title: "기술 설명 연습",
    description: "복잡한 기술 개념을 비전공자도 이해할 수 있게 설명하는 연습",
    icon: MessageSquare,
    iconColor: "bg-violet-500/20 text-violet-400",
    duration: "15분",
  },
  {
    id: "3",
    title: "압박 질문 연습",
    description: "예상치 못한 질문과 압박 상황에서 침착하게 대응하는 연습",
    icon: AlertTriangle,
    iconColor: "bg-rose-500/20 text-rose-400",
    duration: "10분",
  },
]

export function RecommendedPractice() {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Lightbulb className="h-4.5 w-4.5 text-primary" />
          추천 연습
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommendation Text */}
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm text-foreground">
            취약점을 바탕으로 추천드리는 연습입니다
          </p>
        </div>

        {/* Practice Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {practiceItems.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.id}
                className="group flex cursor-pointer flex-col rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-secondary/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="border-border/50 bg-secondary/50 text-xs text-muted-foreground">
                    {item.duration}
                  </Badge>
                </div>

                <h4 className="mb-1.5 text-sm font-semibold text-foreground">{item.title}</h4>
                <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>

                <div className="flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  시작하기
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
