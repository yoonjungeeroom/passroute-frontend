"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Link as LinkIcon,
  FileText,
  Calendar,
  Save,
  Clock,
  GraduationCap,
  X,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SelfIntroModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editMode?: boolean
  initialData?: SelfIntroData | null
  onDelete?: () => void
}

interface Question {
  id: string
  question: string
  answer: string
}

interface SelfIntroData {
  id?: string
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
  "인성면접", "기술면접"
]

const MAX_CHAR_LIMIT = 1000

export function SelfIntroModal({ 
  open, 
  onOpenChange, 
  editMode = false, 
  initialData = null,
  onDelete 
}: SelfIntroModalProps) {
  const [data, setData] = useState<SelfIntroData>({
    company: "",
    role: "",
    experience: "",
    experienceYears: undefined,
    jdText: "",
    jobPostingUrl: "",
    notes: "",
    questions: [{ id: "1", question: "", answer: "" }],
    interviewDate: "",
    interviewTime: "",
    interviewStage: "",
  })

  const [customCompany, setCustomCompany] = useState("")
  const [customRole, setCustomRole] = useState("")

  useEffect(() => {
    if (open && initialData) {
      setData(initialData)
    } else if (open && !editMode) {
      // Reset form for new entry
      setData({
        company: "",
        role: "",
        experience: "",
        experienceYears: undefined,
        jdText: "",
        jobPostingUrl: "",
        notes: "",
        questions: [{ id: "1", question: "", answer: "" }],
        interviewDate: "",
        interviewTime: "",
        interviewStage: "",
      })
    }
  }, [open, initialData, editMode])

  const addQuestion = () => {
    setData(prev => ({
      ...prev,
      questions: [...prev.questions, { id: Date.now().toString(), question: "", answer: "" }]
    }))
  }

  const removeQuestion = (id: string) => {
    if (data.questions.length > 1) {
      setData(prev => ({
        ...prev,
        questions: prev.questions.filter(q => q.id !== id)
      }))
    }
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

  const handleTempSave = () => {
    // Save draft logic
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/50 bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            {editMode ? "자기소개서 수정" : "새 자기소개서 추가"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            지원 정보와 자기소개서 문항을 입력해주세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section A: Application Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">지원 정보</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Company */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">기업명 *</Label>
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
                <Label className="text-xs text-muted-foreground">직무 *</Label>
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

              {/* Experience Level */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">경력 구분 *</Label>
                <div className="flex gap-2">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setData(prev => ({ ...prev, experience: level.id }))}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-sm transition-all",
                        data.experience === level.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border/50 text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Years (only show if experienced) */}
              {data.experience === "experienced" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">경력 연차</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    placeholder="연차를 입력하세요"
                    value={data.experienceYears || ""}
                    onChange={(e) => setData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || undefined }))}
                    className="border-border/50 bg-secondary/30"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Section B: Job Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">채용 정보</h3>
            </div>

            <div className="space-y-4">
              {/* JD Text */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">JD (직무 설명)</Label>
                <Textarea
                  placeholder="채용 공고의 직무 설명을 붙여넣으세요"
                  value={data.jdText}
                  onChange={(e) => setData(prev => ({ ...prev, jdText: e.target.value }))}
                  className="min-h-[80px] border-border/50 bg-secondary/30"
                />
              </div>

              {/* Job Posting URL */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <LinkIcon className="h-3 w-3" />
                  채용공고 URL
                </Label>
                <Input
                  placeholder="https://..."
                  value={data.jobPostingUrl}
                  onChange={(e) => setData(prev => ({ ...prev, jobPostingUrl: e.target.value }))}
                  className="border-border/50 bg-secondary/30"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">메모</Label>
                <Textarea
                  placeholder="추가 메모를 입력하세요"
                  value={data.notes}
                  onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[60px] border-border/50 bg-secondary/30"
                />
              </div>
            </div>
          </section>

          {/* Section C: Self-Introduction Questions */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">자소서 문항</h3>
              <Badge variant="secondary" className="text-xs">{data.questions.length}개</Badge>
            </div>

            <div className="space-y-4">
              {data.questions.map((q, index) => (
                <div key={q.id} className="space-y-2 rounded-xl border border-border/50 bg-secondary/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">문항 {index + 1}</span>
                    {data.questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(q.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="질문을 입력하세요"
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                    className="border-border/50 bg-secondary/30"
                  />
                  <div className="space-y-1">
                    <Textarea
                      placeholder="답변을 입력하세요"
                      value={q.answer}
                      onChange={(e) => updateQuestion(q.id, "answer", e.target.value)}
                      className="min-h-[100px] border-border/50 bg-secondary/30"
                      maxLength={MAX_CHAR_LIMIT}
                    />
                    <div className="flex justify-end">
                      <span className={cn(
                        "text-xs",
                        q.answer.length > MAX_CHAR_LIMIT * 0.9 
                          ? "text-rose-400" 
                          : "text-muted-foreground"
                      )}>
                        {q.answer.length} / {MAX_CHAR_LIMIT}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Question Button - at the bottom for continuous writing flow */}
              <Button
                variant="outline"
                onClick={addQuestion}
                className="w-full gap-2 border-dashed border-border/50 py-6 text-muted-foreground hover:border-primary/50 hover:text-foreground"
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
              <h3 className="font-semibold text-foreground">면접 일정</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">날짜</Label>
                <Input
                  type="date"
                  value={data.interviewDate}
                  onChange={(e) => setData(prev => ({ ...prev, interviewDate: e.target.value }))}
                  className="border-border/50 bg-secondary/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">시간</Label>
                <Input
                  type="time"
                  value={data.interviewTime}
                  onChange={(e) => setData(prev => ({ ...prev, interviewTime: e.target.value }))}
                  className="border-border/50 bg-secondary/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">면접 단계</Label>
                <Select
                  value={data.interviewStage}
                  onValueChange={(value) => setData(prev => ({ ...prev, interviewStage: value }))}
                >
                  <SelectTrigger className="border-border/50 bg-secondary/30">
                    <SelectValue placeholder="단계 선택" />
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
        <div className="flex items-center justify-between border-t border-border/30 pt-4">
          <div className="flex items-center gap-2">
            {editMode && onDelete && (
              <Button
                variant="ghost"
                onClick={onDelete}
                className="gap-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleTempSave}
              className="gap-1.5 border-border/50"
            >
              <Clock className="h-4 w-4" />
              임시 저장
            </Button>
            <Button
              onClick={handleSave}
              className="gap-1.5 bg-gradient-to-r from-primary to-violet-600 text-white hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              저장 완료
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
