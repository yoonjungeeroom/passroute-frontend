"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart3 } from "lucide-react"

const skillsData = [
  { skill: "논리력", value: 85, fullMark: 100 },
  { skill: "소통력", value: 78, fullMark: 100 },
  { skill: "자신감", value: 82, fullMark: 100 },
  { skill: "시선처리", value: 70, fullMark: 100 },
  { skill: "전문성", value: 88, fullMark: 100 },
]

const chartConfig = {
  value: {
    label: "점수",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

export function SkillsChart() {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <BarChart3 className="h-4 w-4 text-primary" />
          역량 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[200px]">
          <RadarChart data={skillsData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            />
            <PolarGrid
              stroke="var(--color-border)"
              strokeOpacity={0.4}
            />
            <Radar
              name="역량"
              dataKey="value"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{
                r: 3,
                fill: "var(--color-primary)",
                strokeWidth: 0,
              }}
            />
          </RadarChart>
        </ChartContainer>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {skillsData.map((item) => (
            <div 
              key={item.skill} 
              className="flex items-center justify-between rounded-lg bg-secondary/50 px-2.5 py-2"
            >
              <span className="text-muted-foreground">{item.skill}</span>
              <span className="font-semibold text-foreground">{item.value}점</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
