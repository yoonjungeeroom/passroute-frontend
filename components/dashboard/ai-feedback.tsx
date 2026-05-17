import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, TrendingUp, AlertCircle, Lightbulb } from "lucide-react"

const feedbacks = [
  {
    type: "positive",
    icon: TrendingUp,
    text: "논리력과 전문성은 우수합니다",
  },
  {
    type: "improvement",
    icon: AlertCircle,
    text: "시선 처리와 전달력을 개선해보세요",
  },
  {
    type: "tip",
    icon: Lightbulb,
    text: "짧고 명확하게 말하는 연습을 추천합니다",
  },
]

export function AIFeedback() {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          AI 피드백
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {feedbacks.map((feedback, index) => {
          const Icon = feedback.icon
          return (
            <div
              key={index}
              className={`flex items-start gap-3 rounded-lg p-3 ${
                feedback.type === "positive"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : feedback.type === "improvement"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-primary/15 text-primary"
              }`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm font-medium leading-relaxed">{feedback.text}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
