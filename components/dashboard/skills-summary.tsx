"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Brain,
  Target,
  Heart,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface SkillCard {
  id: string
  label: string
  score: number
  trend: "up" | "down" | "stable"
  icon: typeof Brain
  color: string
}

const skillCards: SkillCard[] = [
  {
    id: "logic",
    label: "논리성",
    score: 82,
    trend: "up",
    icon: Brain,
    color: "text-[var(--color-primary)]",
  },
  {
    id: "fit",
    label: "직무 적합도",
    score: 78,
    trend: "stable",
    icon: Target,
    color: "text-[var(--color-accent)]",
  },
  {
    id: "attitude",
    label: "태도 안정도",
    score: 71,
    trend: "down",
    icon: Heart,
    color: "text-rose-600",
  },
]

const scoreHistory = [
  { date: "3/15", score: 72 },
  { date: "3/18", score: 76 },
  { date: "3/21", score: 74 },
  { date: "3/24", score: 79 },
  { date: "3/27", score: 82 },
  { date: "3/30", score: 85 },
]

const chartConfig = {
  score: {
    label: "점수",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const insights = [
  { text: "논리성은 최근 상승 중이에요", type: "positive" as const },
  { text: "태도 안정도 보완이 필요해요", type: "negative" as const },
]

function getTrendIcon(trend: "up" | "down" | "stable") {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
    case "down":
      return <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
    default:
      return <Minus className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
  }
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600"
  if (score >= 75) return "text-[var(--color-primary)]"
  if (score >= 65) return "text-amber-600"
  return "text-rose-600"
}

export function SkillsSummary() {
  const router = useRouter()

  return (
    <Card className="border-[var(--color-border)] bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
          <BarChart3 className="h-4.5 w-4.5 text-[var(--color-accent)]" />
          역량 종합 현황
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          onClick={() => router.push("/reports")}
        >
          전체보기
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skill Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {skillCards.map((skill) => {
            const Icon = skill.icon
            return (
              <div
                key={skill.id}
                className="rounded-xl border border-[var(--color-border)] bg-white p-4 transition-all hover:border-[var(--color-accent)]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", skill.color)} />
                    <span className="text-sm font-medium text-[var(--color-text)]">{skill.label}</span>
                  </div>
                  {getTrendIcon(skill.trend)}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={cn("text-2xl font-bold", getScoreColor(skill.score))}>
                    {skill.score}
                  </span>
                  <span className="text-sm text-[var(--color-text-muted)]">/ 100</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Score Trend Chart */}
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <h4 className="mb-3 text-sm font-medium text-[var(--color-text)]">점수 추이</h4>
          <ChartContainer config={chartConfig} className="h-[120px] w-full">
            <LineChart data={scoreHistory} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              />
              <YAxis 
                domain={[60, 100]} 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                width={30}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-primary)', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Insights */}
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                insight.type === "positive"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              )}
            >
              {insight.type === "positive" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {insight.text}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
