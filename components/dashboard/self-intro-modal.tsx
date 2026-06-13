"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  FileText,
  Calendar,
  Save,
  GraduationCap,
  X,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getSelfIntroDetail,
  createSelfIntro,
  updateSelfIntro,
  deleteSelfIntro,
} from "@/lib/api/self-intro"

interface SelfIntroModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editMode?: boolean
  editId?: number | null
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
  "네이버", "카카오", "카카오페이", "카카오뱅크", "토스",
  "쿠팡", "배달의민족", "당근", "라인", "야놀자",
  "삼성전자", "LG전자", "SK하이닉스", "현대자동차",
  "KT", "SK텔레콤", "NHN", "넷마블", "데브시스터즈",
  "무신사", "올리브영", "마켓컬리", "뱅크샐러드", "쏘카",
  "인프랩", "11번가", "지마켓",
]

const roles = [
  "백엔드 개발자", "프론트엔드 개발자", "풀스택 개발자", "앱 개발자",
  "AI/ML 엔지니어", "MLOps 엔지니어", "데이터 엔지니어", "데이터 사이언티스트",
  "DevOps 엔지니어", "클라우드 엔지니어", "보안 엔지니어", "시스템 엔지니어",
  "네트워크 엔지니어", "QA 엔지니어", "게임 개발자", "임베디드 개발자",
  "블록체인 개발자", "DBA",
]

const experienceLevels = [
  { id: "intern", label: "인턴" },
  { id: "entry", label: "신입" },
  { id: "experienced", label: "경력" },
]

const interviewStages = ["인성면접", "기술면접"]

const MAX_CHAR_LIMIT = 1000

const careerLevelMap: Record<string, string> = {
  intern: "INTERN",
  entry: "JUNIOR",
  experienced: "SENIOR",
}

const reverseCareerMap: Record<string, string> = {
  INTERN: "intern",
  JUNIOR: "entry",
  SENIOR: "experienced",
}

export function SelfIntroModal({
  open,
  onOpenChange,
  editMode = false,
  editId = null,
}: SelfIntroModalProps) {
  const [data, setData] = useState<SelfIntroData>({
    company: "",
    role: "",
    experience: "",
    jdText: "",
    jobPostingUrl: "",
    notes: "",
    questions: [{ id: "1", question: "", answer: "" }],
    interviewDate: "",
    interviewTime: "",
    interviewStage: "",
  })

  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false)
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (open && editMode && editId) {
      setLoadingDetail(true)
      getSelfIntroDetail(editId)
        .then((detail) => {
          setData({
            id: String(detail.id),
            company: detail.companyName,
            role: detail.jobPosition,
            experience: reverseCareerMap[detail.careerLevel] || "",
            jdText: detail.jobDescription || "",
            jobPostingUrl: detail.jobPostingUrl || "",
            notes: detail.memo || "",
            questions:
              detail.items.length > 0
                ? detail.items.map((item) => ({
                    id: String(item.id),
                    question: item.questionText,
                    answer: item.answerText,
                  }))
                : [{ id: "1", question: "", answer: "" }],
            interviewDate: detail.interviewDate || "",
            interviewTime: detail.interviewTime || "",
            interviewStage: detail.interviewStage || "",
          })
        })
        .catch(() => {})
        .finally(() => setLoadingDetail(false))
    } else if (open && !editMode) {
      setData({
        company: "",
        role: "",
        experience: "",
        jdText: "",
        jobPostingUrl: "",
        notes: "",
        questions: [{ id: "1", question: "", answer: "" }],
        interviewDate: "",
        interviewTime: "",
        interviewStage: "",
      })
    }
  }, [open, editMode, editId])

  const addQuestion = () => {
    setData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: Date.now().toString(), question: "", answer: "" },
      ],
    }))
  }

  const removeQuestion = (id: string) => {
    if (data.questions.length > 1) {
      setData((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== id),
      }))
    }
  }

  const updateQuestion = (id: string, field: "question" | "answer", value: string) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    }))
  }

  const handleSave = async () => {
    const companyName = data.company.trim()
    const jobPosition = data.role.trim()
    const careerLevel = (careerLevelMap[data.experience] || "JUNIOR") as "INTERN" | "JUNIOR" | "SENIOR"
    if (!companyName || !jobPosition) return

    const payload = {
      companyName,
      jobPosition,
      careerLevel,
      jobDescription: data.jdText || undefined,
      jobPostingUrl: data.jobPostingUrl || undefined,
      memo: data.notes || undefined,
      interviewDate: data.interviewDate || undefined,
      interviewTime: data.interviewTime || undefined,
      interviewStage: data.interviewStage || undefined,
      items: data.questions
        .filter((q) => q.question.trim())
        .map((q) => ({ questionText: q.question, answerText: q.answer || undefined })),
    }

    setSaving(true)
    try {
      if (editMode && editId) {
        await updateSelfIntro(editId, payload)
      } else {
        await createSelfIntro(payload)
      }
      onOpenChange(false)
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editId) return
    setDeleting(true)
    try {
      await deleteSelfIntro(editId)
      onOpenChange(false)
    } catch {
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white sm:max-w-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="h-5 w-5 text-blue-600" />
            {editMode ? "자기소개서 수정" : "새 자기소개서 추가"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            지원 정보와 자기소개서 문항을 입력해주세요
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="space-y-7 py-2">
            {/* 지원 정보 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900">지원 정보</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* 기업명 */}
                <div className="relative space-y-1.5">
                  <Label className="text-xs text-slate-400">기업명 *</Label>
                  <Input
                    placeholder="기업명 입력 또는 선택"
                    value={data.company}
                    onChange={(e) => setData((prev) => ({ ...prev, company: e.target.value }))}
                    onFocus={() => setShowCompanySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 150)}
                    className="border-slate-200 bg-slate-50 focus-visible:border-blue-400 focus-visible:ring-0"
                  />
                  {showCompanySuggestions && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {companies
                        .filter((c) => !data.company || c.includes(data.company))
                        .map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            onMouseDown={() => setData((prev) => ({ ...prev, company: c }))}
                          >
                            {c}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* 직무 */}
                <div className="relative space-y-1.5">
                  <Label className="text-xs text-slate-400">직무 *</Label>
                  <Input
                    placeholder="직무 입력 또는 선택"
                    value={data.role}
                    onChange={(e) => setData((prev) => ({ ...prev, role: e.target.value }))}
                    onFocus={() => setShowRoleSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 150)}
                    className="border-slate-200 bg-slate-50 focus-visible:border-blue-400 focus-visible:ring-0"
                  />
                  {showRoleSuggestions && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {roles
                        .filter((r) => !data.role || r.includes(data.role))
                        .map((r) => (
                          <button
                            key={r}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            onMouseDown={() => setData((prev) => ({ ...prev, role: r }))}
                          >
                            {r}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* 경력 구분 */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">경력 구분 *</Label>
                  <div className="flex gap-2">
                    {experienceLevels.map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setData((prev) => ({ ...prev, experience: level.id }))}
                        className={cn(
                          "flex-1 rounded-lg border py-2 text-sm font-medium transition-all",
                          data.experience === level.id
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-slate-200 text-slate-500 hover:border-blue-200 hover:text-slate-700"
                        )}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 경력 연차 */}
                {data.experience === "experienced" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">경력 연차</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="연차를 입력하세요"
                      value={data.experienceYears || ""}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          experienceYears: parseInt(e.target.value) || undefined,
                        }))
                      }
                      className="border-slate-200 bg-slate-50"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* 자소서 문항 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900">자소서 문항</h3>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                  {data.questions.length}개
                </span>
              </div>

              <div className="space-y-3">
                {data.questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">문항 {index + 1}</span>
                      {data.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder="질문을 입력하세요"
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                      className="border-slate-200 bg-white focus-visible:border-blue-400 focus-visible:ring-0"
                    />
                    <div className="space-y-1">
                      <Textarea
                        placeholder="답변을 입력하세요"
                        value={q.answer}
                        onChange={(e) => updateQuestion(q.id, "answer", e.target.value)}
                        className="min-h-[100px] border-slate-200 bg-white focus-visible:border-blue-400 focus-visible:ring-0"
                        maxLength={MAX_CHAR_LIMIT}
                      />
                      <div className="flex justify-end">
                        <span
                          className={cn(
                            "text-xs",
                            q.answer.length > MAX_CHAR_LIMIT * 0.9
                              ? "text-rose-400"
                              : "text-slate-400"
                          )}
                        >
                          {q.answer.length} / {MAX_CHAR_LIMIT}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm font-semibold text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-500"
                >
                  <Plus className="h-4 w-4" />
                  문항 추가
                </button>
              </div>
            </section>

            {/* 면접 일정 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900">면접 일정</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">날짜</Label>
                  <Input
                    type="date"
                    value={data.interviewDate}
                    onChange={(e) => setData((prev) => ({ ...prev, interviewDate: e.target.value }))}
                    className="border-slate-200 bg-slate-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">시간</Label>
                  <Input
                    type="time"
                    value={data.interviewTime}
                    onChange={(e) => setData((prev) => ({ ...prev, interviewTime: e.target.value }))}
                    className="border-slate-200 bg-slate-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">면접 단계</Label>
                  <Select
                    value={data.interviewStage}
                    onValueChange={(value) =>
                      setData((prev) => ({ ...prev, interviewStage: value }))
                    }
                  >
                    <SelectTrigger className="border-slate-200 bg-slate-50">
                      <SelectValue placeholder="단계 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {interviewStages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            {editMode && editId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                삭제
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !data.company.trim() || !data.role.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "저장 중..." : "저장 완료"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
