"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, GraduationCap, Clock, Sparkles } from "lucide-react"

interface AnalysisResultProps {
  data: {
    jobTitle: string
    skills: string[]
    experience: string
    education: string
  }
}

export function AnalysisResult({ data }: AnalysisResultProps) {
  return (
    <Card className="mt-6 border-slate-800 bg-slate-900/50">
      <CardHeader className="border-b border-slate-800 pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-violet-400" />
          AI 분석 결과
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Job Title */}
          <div className="rounded-xl bg-slate-800/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <Briefcase className="h-4 w-4" />
              추출된 직무
            </div>
            <p className="text-xl font-semibold text-white">{data.jobTitle}</p>
          </div>

          {/* Experience */}
          <div className="rounded-xl bg-slate-800/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <Clock className="h-4 w-4" />
              경력
            </div>
            <p className="text-xl font-semibold text-white">{data.experience}</p>
          </div>

          {/* Education */}
          <div className="rounded-xl bg-slate-800/50 p-4 md:col-span-2">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <GraduationCap className="h-4 w-4" />
              학력
            </div>
            <p className="text-lg font-medium text-white">{data.education}</p>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-slate-400">핵심 기술 스택</p>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-violet-600/20 text-violet-300 hover:bg-violet-600/30"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* AI Suggestion */}
        <div className="mt-6 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="mb-1 font-medium text-violet-300">AI 추천</p>
              <p className="text-sm text-slate-300">
                이력서 분석 결과, <span className="text-violet-400">{data.jobTitle}</span> 직무에 
                적합한 면접 질문을 생성할 준비가 완료되었습니다. 
                아래 &quot;Start Interview&quot; 버튼을 클릭하여 맞춤형 면접 연습을 시작하세요.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
