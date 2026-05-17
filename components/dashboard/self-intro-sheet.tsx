"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Briefcase,
  Plus,
  Trash2,
  GripVertical,
  Link,
  FileText,
  Calendar,
  Save,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SelfIntroSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editMode?: boolean
  initialData?: SelfIntroData | null
}

interface Question {
  id: string
  question: string
  answer: string
}

interface SelfIntroData {
  company: string
  role: string
  experience: string
  experienceYears?: number
  jdText: string
  jobPostingUrl: string
  notes: string
  questions: Question[]
  interviewDate: string
  interviewTime: string
  interviewStage: string
}

const companies = [
  "삼성전자", "SK하이닉스", "LG전자", "네이버", "카카오", 
  "쿠팡", "라인", "배달의민족", "토스", "당근마켓",
  "현대자동차", "기아", "포스코", "KT", "SK텔레콤", "기타"
]

const roles = [
  "백엔드 개발자", "프론트엔드 개발자", "풀스택 개발자", 
  "AI/ML 엔지니어", "데이터 엔지니어", "데이터 분석가",
  "DevOps 엔지니어", "보안 엔지니어", "QA 엔지니어",
  "iOS 개발자", "Android 개발자", "게임 개발자", "기타"
]

const experienceLevels = [
  { id: "intern", label: "인턴" },
  { id: "entry", label: "신입" },
  { id: "experienced", label: "경력" },
]

const interviewStages = [
  "인성 면접", "직무 면접", "실무 면접", "임원 면접", "기술 면접"
]

export function SelfIntroSheet({ open, onOpenChange, editMode = false, initialData = null }: SelfIntroSheetProps) {
  const [data, setData] = useState<SelfIntroData>({
    company: initialData?.company || "",
    role: initialData?.role || "",
    experience: initialData?.experience || "",
    experienceYears: initialData?.experienceYears,
    jdText: initialData?.jdText || "",
    jobPostingUrl: initialData?.jobPostingUrl || "",
    notes: initialData?.notes || "",
    questions: initialData?.questions || [{ id: "1", question: "", answer: "" }],
    interviewDate: initialData?.interviewDate || "",
    interviewTime: initialData?.interviewTime || "",
    interviewStage: initialData?.interviewStage || "",
  })

  const [customCompany, setCustomCompany] = useState("")
  const [customRole, setCustomRole] = useState("")

  const addQuestion = () => {
    setData(prev => ({
      ...prev,
      questions: [...prev.questions, { id: Date.now().toString(), question: "", answer: "" }]
    }))
  }

  const removeQuestion = (id: string) => {
    setData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }))
  }

  const updateQuestion = (id: string, field: "question" | "answer", value: string) => {
    setData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
    }))
  }

  const handleSave = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-border/50 bg-card sm:max-w-xl">
        <SheetHeader className="border-b border-border/30 pb-4">
          <SheetTitle className="text-lg font-semibold text-foreground">
            {editMode ? "자기소개서 수정" : "새 자기소개서 추가"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            지원 정보와 자기소개서 문항을 입력해주세요
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Section A: Application Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">지원 정보</h3>
            </div>

            <div className="space-y-3">
              {/* Company */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">기업명</Label>
                <Select
                  value={data.company}
                  onValueChange={(value) => setData(prev => ({ ...prev, company: value }))}
                >
                  <SelectTrigger className="border-border/50 bg-secondary/30">
                    <SelectValue placeholder="기업을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>{company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {data.company === "기타" && (
                  <Input
                    placeholder="기업명을 입력하세요"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    className="mt-2 border-border/50 bg-secondary/30"
                  />
                )}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">직무</Label>
                <Select
                  value={data.role}
                  onValueChange={(value) => setData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="border-border/50 bg-secondary/30">
                    <SelectValue placeholder="직무를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {data.role === "기타" && (
                  <Input
                    placeholder="직무를 입력하세요"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="mt-2 border-border/50 bg-secondary/30"
                  />
                )}
              </div>

              {/* Experience */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">경력 수준</Label>
                <div className="flex gap-2">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setData(prev => ({ ...prev, experience: level.id }))}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        data.experience === level.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
                {data.experience === "experienced" && (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="경력 년수"
                      value={data.experienceYears || ""}
                      onChange={(e) => setData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) }))}
                      className="w-24 border-border/50 bg-secondary/30"
                    />
                    <span className="text-sm text-muted-foreground">년</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section B: Job Posting Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">채용 공고 정보</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">JD (직무 기술서)</Label>
                <Textarea
                  placeholder="채용 공고의 직무 기술서를 붙여넣으세요"
                  value={data.jdText}
                  onChange={(e) => setData(prev => ({ ...prev, jdText: e.target.value }))}
                  className="min-h-[100px] border-border/50 bg-secondary/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">채용 공고 URL</Label>
                <Input
                  placeholder="https://..."
                  value={data.jobPostingUrl}
                  onChange={(e) => setData(prev => ({ ...prev, jobPostingUrl: e.target.value }))}
                  className="border-border/50 bg-secondary/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">메모 (선택)</Label>
                <Textarea
                  placeholder="추가 메모를 입력하세요"
                  value={data.notes}
                  onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[60px] border-border/50 bg-secondary/30"
                />
              </div>
            </div>
          </section>

          {/* Section C: Questions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">자기소개서 문항</h3>
              </div>
              <Badge variant="outline" className="border-border/50 text-xs">
                {data.questions.length}개 문항
              </Badge>
            </div>

            <div className="space-y-4">
              {data.questions.map((q, index) => (
                <div
                  key={q.id}
                  className="group relative rounded-xl border border-border/50 bg-secondary/20 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 cursor-move text-muted-foreground/50" />
                      <span className="text-sm font-medium text-foreground">문항 {index + 1}</span>
                    </div>
                    {data.questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                        onClick={() => removeQuestion(q.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="질문을 입력하세요"
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                      className="border-border/50 bg-secondary/30 text-sm"
                    />
                    <div className="relative">
                      <Textarea
                        placeholder="답변을 입력하세요"
                        value={q.answer}
                        onChange={(e) => updateQuestion(q.id, "answer", e.target.value)}
                        className="min-h-[120px] border-border/50 bg-secondary/30 text-sm"
                      />
                      <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                        {q.answer.length}자
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addQuestion}
                className="w-full gap-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary"
              >
                <Plus className="h-4 w-4" />
                문항 추가
              </Button>
            </div>
          </section>

          {/* Section D: Interview Schedule */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">면접 일정 연결</h3>
              <Badge variant="outline" className="border-border/50 text-[10px]">선택</Badge>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">예상 면접일</Label>
                  <Input
                    type="date"
                    value={data.interviewDate}
                    onChange={(e) => setData(prev => ({ ...prev, interviewDate: e.target.value }))}
                    className="border-border/50 bg-secondary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">면접 시간</Label>
                  <Input
                    type="time"
                    value={data.interviewTime}
                    onChange={(e) => setData(prev => ({ ...prev, interviewTime: e.target.value }))}
                    className="border-border/50 bg-secondary/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">면접 단계</Label>
                <Select
                  value={data.interviewStage}
                  onValueChange={(value) => setData(prev => ({ ...prev, interviewStage: value }))}
                >
                  <SelectTrigger className="border-border/50 bg-secondary/30">
                    <SelectValue placeholder="면접 단계를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {interviewStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 border-t border-border/30 bg-card pt-4">
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" className="flex-1 gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                  <Trash2 className="h-4 w-4" />
                  삭제
                </Button>
                <Button onClick={handleSave} className="flex-1 gap-1.5 bg-gradient-to-r from-primary to-violet-600 text-white hover:opacity-90">
                  <Save className="h-4 w-4" />
                  저장
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="flex-1 border-border/50">
                  임시 저장
                </Button>
                <Button onClick={handleSave} className="flex-1 gap-1.5 bg-gradient-to-r from-primary to-violet-600 text-white hover:opacity-90">
                  <Save className="h-4 w-4" />
                  저장 완료
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
