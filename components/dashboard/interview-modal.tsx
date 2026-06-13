"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"

import { Label } from "@/components/ui/label"
import {
  UserRound,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Mic,
  Briefcase,
  Crown,
  Heart,
  Code,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Building2,
  CheckCircle,
  Loader2,
  Dumbbell,
  Swords,
  FileText,
  FolderOpen,
  Target,
  Sparkles,
  X,
  Newspaper,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { setupInterview, startInterview } from "@/lib/api/interview"
import { getSelfIntroList, type SelfIntroResponse } from "@/lib/api/self-intro"
import { getDocumentList, type DocumentItem } from "@/lib/api/documents"
import {
  getDebateTopics,
  getDebatePersonas,
  suggestDebateTopics,
  generateDebateTopic,
  type DebateTopic,
  type DebatePersona,
  type SuggestedTopicCandidate,
} from "@/lib/api/debate"

interface InterviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefillData?: PrefillData | null
}

interface PrefillData {
  introId: number
  stage: string
  mode: string
  practiceMode: "practice" | "real"
  personas: string[]
}

const careerLabels: Record<string, string> = {
  INTERN: "인턴",
  JUNIOR: "신입",
  SENIOR: "경력",
}

const categoryLabel: Record<string, string> = {
  AI_ETHICS: "AI 윤리",
  RECRUITMENT: "채용",
  DEV_CULTURE: "개발 문화",
  TECH_TREND: "기술 트렌드",
}

const interviewStages = [
  { id: "personality", title: "인성면접", description: "가치관, 성격, 조직 적합성" },
  { id: "technical", title: "기술면접", description: "기술 지식 및 문제 해결" },
]

const interviewModes = [
  {
    id: "one-on-one",
    title: "1:1 면접",
    description: "면접관 1명과 집중적으로 진행",
    icon: UserRound,
  },
  {
    id: "group",
    title: "토론 면접",
    description: "AI 경쟁자와 함께 토론 형식으로 진행",
    icon: Users,
  },
]

const practiceModes = [
  {
    id: "practice",
    title: "연습 모드",
    description: "부담 없이 연습하고 피드백 받기",
    icon: Dumbbell,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "real",
    title: "실전 모드",
    description: "실제 면접처럼 긴장감 있게 진행",
    icon: Swords,
    color: "from-rose-500 to-orange-500",
  },
]

interface PersonaSettings {
  pressure: number
  followUp: number
  difficulty: "EASY" | "NORMAL" | "HARD"
}

const personas: {
  id: string
  title: string
  subtitle: string
  icon: typeof Briefcase
  description: string
  defaults: PersonaSettings
  color: string
}[] = [
  {
    id: "TEAM_LEAD",
    title: "실무검증형",
    subtitle: "현업 실무자/팀장",
    icon: Briefcase,
    description: "기술 선택 이유, 프로젝트 진위, 문제 해결",
    defaults: { pressure: 6, followUp: 5, difficulty: "HARD" },
    color: "bg-blue-600",
  },
  {
    id: "EXECUTIVE",
    title: "임원형",
    subtitle: "사업부장/본부장",
    icon: Crown,
    description: "동기, 태도, 성장 가능성, 조직 적합성",
    defaults: { pressure: 5, followUp: 4, difficulty: "NORMAL" },
    color: "bg-blue-600",
  },
  {
    id: "HR_MANAGER",
    title: "인성면접관",
    subtitle: "HR/문화 적합성",
    icon: Heart,
    description: "갈등 해결, 피드백 수용, 가치관",
    defaults: { pressure: 3, followUp: 4, difficulty: "EASY" },
    color: "bg-blue-600",
  },
  {
    id: "TECH_INTERVIEWER",
    title: "기술면접관",
    subtitle: "CTO/테크리드",
    icon: Code,
    description: "아키텍처, 트레이드오프, 예외 상황 대응",
    defaults: { pressure: 6, followUp: 5, difficulty: "HARD" },
    color: "bg-blue-600",
  },
]

export function InterviewModal({ open, onOpenChange, prefillData }: InterviewModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  // Shared
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [selectedPracticeMode, setSelectedPracticeMode] = useState<"practice" | "real">("practice")
  // 1:1
  const [selectedIntro, setSelectedIntro] = useState<number | null>(null)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [settings, setSettings] = useState<PersonaSettings>({
    pressure: 5,
    followUp: 3,
    difficulty: "NORMAL" as const,
  })
  const [interviewCount, setInterviewCount] = useState(5)
  const [personaIdx, setPersonaIdx] = useState(0)
  const [dpIdx, setDpIdx] = useState(0)
  const [starting, setStarting] = useState(false)
  const [selfIntros, setSelfIntros] = useState<SelfIntroResponse[]>([])
  const [loadingIntros, setLoadingIntros] = useState(false)
  const [resumes, setResumes] = useState<DocumentItem[]>([])
  const [portfolios, setPortfolios] = useState<DocumentItem[]>([])
  const [selectedResume, setSelectedResume] = useState<number | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  // 토론
  const [selectedDebateIntro, setSelectedDebateIntro] = useState<number | null>(null)
  const [debateTopics, setDebateTopics] = useState<DebateTopic[]>([])
  const [debatePersonas, setDebatePersonas] = useState<DebatePersona[]>([])
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null)
  const [selectedStance, setSelectedStance] = useState<"PRO" | "CON" | null>(null)
  const [selectedDebatePersona, setSelectedDebatePersona] = useState<DebatePersona | null>(null)
  const [debateDifficulty, setDebateDifficulty] = useState<"EASY" | "NORMAL" | "HARD">("NORMAL")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [loadingDebate, setLoadingDebate] = useState(false)
  // 토론 주제 — 최신 이슈 추천 흐름
  const [topicMode, setTopicMode] = useState<"list" | "suggest">("list")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [suggestCount, setSuggestCount] = useState(3)
  const [candidates, setCandidates] = useState<SuggestedTopicCandidate[]>([])
  const [newsCount, setNewsCount] = useState<number | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<SuggestedTopicCandidate | null>(null)
  const [generatedTopic, setGeneratedTopic] = useState<DebateTopic | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [topicError, setTopicError] = useState<string | null>(null)

  const isGroup = selectedMode === "group"

  const KEYWORD_PRESETS = ["AI", "채용", "개발 문화", "기술 트렌드", "면접"]

  const addKeyword = (raw: string) => {
    const kw = raw.trim()
    if (!kw) return
    setKeywords(prev => (prev.includes(kw) ? prev : [...prev, kw]))
    setKeywordInput("")
  }

  const handleSuggest = async () => {
    setSuggesting(true)
    setTopicError(null)
    setCandidates([])
    setSelectedCandidate(null)
    setGeneratedTopic(null)
    setSelectedTopic(null)
    // 입력 중이던(Enter 안 친) 키워드도 포함
    const pending = keywordInput.trim()
    const finalKeywords = pending && !keywords.includes(pending) ? [...keywords, pending] : keywords
    if (pending) {
      setKeywords(finalKeywords)
      setKeywordInput("")
    }
    try {
      const res = await suggestDebateTopics({
        keywords: finalKeywords,
        count: suggestCount,
        ...(selectedDebateIntro !== null ? { introId: selectedDebateIntro } : {}),
      })
      setCandidates(res.candidates)
      setNewsCount(res.newsCount)
      if (res.candidates.length === 0) {
        setTopicError("추천된 주제가 없어요. 키워드를 바꿔 다시 시도해주세요.")
      }
    } catch {
      setTopicError("추천을 불러오지 못했어요. 잠시 후 다시 시도해주세요.")
    } finally {
      setSuggesting(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedCandidate) return
    setGenerating(true)
    setTopicError(null)
    try {
      const topic = await generateDebateTopic({
        title: selectedCandidate.title,
        description: selectedCandidate.description,
        category: selectedCandidate.category,
        ...(selectedDebateIntro !== null ? { introId: selectedDebateIntro } : {}),
      })
      setGeneratedTopic(topic)
      setSelectedTopic(topic) // 이후 3~5단계는 기존 selectedTopic.id 흐름 그대로
    } catch {
      setTopicError("주제 생성에 실패했어요. 다시 시도해주세요.")
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    if (open) {
      setLoadingIntros(true)
      getSelfIntroList().then(setSelfIntros).catch(() => setSelfIntros([])).finally(() => setLoadingIntros(false))

      setLoadingDocs(true)
      Promise.all([
        getDocumentList("RESUME").catch(() => []),
        getDocumentList("PORTFOLIO").catch(() => []),
      ]).then(([r, p]) => {
        setResumes(r)
        setPortfolios(p)
      }).finally(() => setLoadingDocs(false))

      setLoadingDebate(true)
      Promise.all([
        getDebateTopics().catch(() => []),
        getDebatePersonas().catch(() => []),
      ]).then(([t, p]) => {
        setDebateTopics(t)
        setDebatePersonas(p)
      }).finally(() => setLoadingDebate(false))
    }
  }, [open])

  // Prefill data when modal opens
  useEffect(() => {
    if (open && prefillData) {
      setSelectedIntro(prefillData.introId)
      setSelectedStage(prefillData.stage)
      setSelectedMode(prefillData.mode)
      setSelectedPracticeMode(prefillData.practiceMode)
      setSelectedPersonas(prefillData.personas)
    }
  }, [open, prefillData])

  // Update settings when personas change
  useEffect(() => {
    if (selectedPersonas.length > 0) {
      const firstPersona = personas.find(p => p.id === selectedPersonas[0])
      if (firstPersona) {
        setSettings({ ...firstPersona.defaults })
      }
    }
  }, [selectedPersonas])

  // 4단계 진입 시 면접관 자동 선택/배정 (기술면접관은 자동, 인성 계열은 첫 번째 기본 선택)
  useEffect(() => {
    if (step === 4 && !isGroup) {
      if (selectedStage === "technical") {
        setSelectedPersonas(["TECH_INTERVIEWER"])
        setPersonaIdx(0)
      } else {
        const valid = filteredPersonas.some(p => selectedPersonas.includes(p.id))
        if (!valid) {
          const first = filteredPersonas[0]
          if (first) {
            setSelectedPersonas([first.id])
            setSettings(first.defaults)
            setPersonaIdx(0)
          }
        }
      }
    }
  }, [step, isGroup, selectedStage]) // eslint-disable-line react-hooks/exhaustive-deps

  // 5단계(토론) 진입 시 토론 상대 첫 번째 기본 선택
  useEffect(() => {
    if (step === 5 && isGroup && debatePersonas.length > 0 && !selectedDebatePersona) {
      setSelectedDebatePersona(debatePersonas[0])
      setDpIdx(0)
    }
  }, [step, isGroup, debatePersonas]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep(1)
      setSelectedMode(null)
      setSelectedPracticeMode("practice")
      setSelectedIntro(null)
      setSelectedDebateIntro(null)
      setSelectedStage(null)
      setSelectedPersonas([])
      setSelectedResume(null)
      setSelectedPortfolio(null)
      setShowAdvanced(false)
      setSelectedTopic(null)
      setSelectedStance(null)
      setSelectedDebatePersona(null)
      setDebateDifficulty("NORMAL")
      setCategoryFilter("all")
      setTopicMode("list")
      setKeywords([])
      setKeywordInput("")
      setSuggestCount(3)
      setCandidates([])
      setNewsCount(null)
      setSelectedCandidate(null)
      setGeneratedTopic(null)
      setTopicError(null)
    }, 200)
  }

  const totalSteps = isGroup ? 6 : 5

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const goToStep = (targetStep: number) => {
    // Allow going to any previous step or current step
    if (targetStep <= step) {
      setStep(targetStep)
    }
  }


  const canProceed =
    (step === 1 && selectedMode !== null) ||
    (isGroup
      ? (step === 2 && selectedDebateIntro !== null) ||
        (step === 3 && selectedTopic !== null) ||
        (step === 4 && selectedStance !== null) ||
        (step === 5 && selectedDebatePersona !== null) ||
        step === 6
      : (step === 2 && selectedIntro !== null) ||
        (step === 3 && selectedStage !== null) ||
        step === 4 || // Persona is optional
        step === 5)

  const currentIntro = selfIntros.find(i => i.id === selectedIntro)
  const currentDebateIntro = selfIntros.find(i => i.id === selectedDebateIntro)
  const currentStage = interviewStages.find(s => s.id === selectedStage)
  const currentMode = interviewModes.find(m => m.id === selectedMode)

  const stepLabels = isGroup
    ? ["면접 방식", "자기소개서 선택", "토론 주제", "입장 선택", "토론 상대", "난이도 · 확인"]
    : ["면접 방식", "자기소개서 선택", "면접 단계", "면접관 페르소나", "최종 확인"]

  const categories = [...new Set(debateTopics.map(t => t.category))]
  const filteredTopics = categoryFilter === "all"
    ? debateTopics
    : debateTopics.filter(t => t.category === categoryFilter)

  // 면접 단계에 따라 보여줄 페르소나 필터링
  const filteredPersonas = selectedStage === "technical"
    ? personas.filter(p => p.id === "TECH_INTERVIEWER")
    : personas.filter(p => ["HR_MANAGER", "TEAM_LEAD", "EXECUTIVE"].includes(p.id))

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            면접 시작하기
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            면접 방식과 설정을 선택하고 AI 모의 면접을 시작하세요
          </DialogDescription>
        </DialogHeader>

        {/* Clickable Progress Indicator */}
        <div className="flex items-center gap-1.5 py-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <button
              key={s}
              onClick={() => goToStep(s)}
              disabled={s > step}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                s === step
                  ? "bg-blue-600 text-white"
                  : s < step
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                  : "bg-slate-100 text-slate-500 cursor-not-allowed"
              )}
            >
              {s < step ? <Check className="h-3.5 w-3.5" /> : s}
            </button>
          ))}
          <div className="ml-3 text-sm text-slate-500">
            {stepLabels[step - 1]}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[360px] py-4">
          {/* Step 1: Practice/Real Mode + Interview Mode */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Practice vs Real Mode */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-slate-900">모드 선택</h4>
                <div className="grid grid-cols-2 gap-3">
                  {practiceModes.map((mode) => {
                    const Icon = mode.icon
                    const isSelected = selectedPracticeMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setSelectedPracticeMode(mode.id as "practice" | "real")}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border p-4 transition-all duration-200",
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-900">{mode.title}</p>
                          <p className="text-[11px] text-slate-500">{mode.description}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 1:1 vs Group */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-slate-900">면접 방식</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {interviewModes.map((mode) => {
                    const Icon = mode.icon
                    const isSelected = selectedMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setSelectedMode(mode.id)
                          if (mode.id === "one-on-one" && selectedPersonas.length > 1) {
                            setSelectedPersonas(selectedPersonas.slice(0, 1))
                          }
                        }}
                        className={cn(
                          "relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-300",
                          isSelected
                            ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-600/10"
                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl transition-all",
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        )}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-900">{mode.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{mode.description}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================== 1:1 분기 ===================== */}

          {/* Step 2 (1:1): Self Introduction Selection */}
          {step === 2 && !isGroup && (
            <div className="space-y-3">
              <p className="mb-4 text-sm text-slate-500">
                면접에 사용할 자기소개서를 선택해주세요
              </p>
              {loadingIntros ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              ) : selfIntros.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  자기소개서가 없습니다. 먼저 자기소개서를 작성해주세요.
                </div>
              ) : selfIntros.map((intro) => (
                <div
                  key={intro.id}
                  onClick={() => setSelectedIntro(intro.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-300",
                    selectedIntro === intro.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    selectedIntro === intro.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{intro.companyName}</p>
                      <Badge variant="outline" className="text-[10px] border-slate-200">{careerLabels[intro.careerLevel] ?? intro.careerLevel}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {intro.jobPosition} &middot; {intro.itemCount}개 문항
                    </p>
                  </div>
                  {selectedIntro === intro.id && (
                    <Badge className="border-blue-200 bg-blue-100 text-blue-700">선택됨</Badge>
                  )}
                </div>
              ))}

              {/* 이력서 / 포트폴리오 선택 */}
              {selectedIntro !== null && (
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">
                    이력서 / 포트폴리오 선택 <span className="text-xs">(선택하지 않으면 대표 문서 사용)</span>
                  </p>

                  {loadingDocs ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {/* 이력서 */}
                      <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-900">
                          <FileText className="h-3.5 w-3.5" />
                          이력서
                        </p>
                        {resumes.length === 0 ? (
                          <p className="text-[11px] text-slate-500">등록된 이력서가 없습니다</p>
                        ) : resumes.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedResume(selectedResume === doc.id ? null : doc.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-all",
                              selectedResume === doc.id
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                            )}
                          >
                            <span className="flex-1 truncate text-slate-900">{doc.originalFilename}</span>
                            {doc.isRepresentative && (
                              <Badge variant="outline" className="text-[9px] shrink-0">대표</Badge>
                            )}
                            {selectedResume === doc.id && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* 포트폴리오 */}
                      <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-900">
                          <FolderOpen className="h-3.5 w-3.5" />
                          포트폴리오
                        </p>
                        {portfolios.length === 0 ? (
                          <p className="text-[11px] text-slate-500">등록된 포트폴리오가 없습니다</p>
                        ) : portfolios.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedPortfolio(selectedPortfolio === doc.id ? null : doc.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-all",
                              selectedPortfolio === doc.id
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                            )}
                          >
                            <span className="flex-1 truncate text-slate-900">{doc.originalFilename}</span>
                            {doc.isRepresentative && (
                              <Badge variant="outline" className="text-[9px] shrink-0">대표</Badge>
                            )}
                            {selectedPortfolio === doc.id && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 (1:1): Interview Stage */}
          {step === 3 && !isGroup && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                면접 단계를 선택해주세요
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {interviewStages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setSelectedStage(stage.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all duration-200",
                      selectedStage === stage.id
                        ? "border-blue-600 bg-blue-50 text-slate-900"
                        : "border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-slate-50"
                    )}
                  >
                    <span className="text-sm font-medium">{stage.title}</span>
                    <span className="text-[10px] opacity-70">{stage.description}</span>
                  </button>
                ))}
              </div>

              {selectedIntro && (
                <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">선택된 자기소개서</p>
                  <p className="text-sm font-medium text-slate-900">
                    {currentIntro?.companyName} - {currentIntro?.jobPosition}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4 (1:1): Persona */}
          {step === 4 && !isGroup && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">
                  {selectedStage === "technical"
                    ? "기술 면접관이 자동으로 배정됩니다"
                    : "AI 면접관의 성향을 선택해주세요"}
                </p>
                {selectedStage !== "technical" && (
                  <p className="mt-1 text-xs text-slate-500">
                    선택하지 않으면 기본 면접관으로 진행됩니다
                  </p>
                )}
              </div>
              {(() => {
                const isTech = selectedStage === "technical"
                const list = filteredPersonas
                const idx = Math.min(personaIdx, Math.max(list.length - 1, 0))
                const p = list[idx] ?? list[0]
                const Icon = p?.icon ?? Briefcase
                const multi = list.length > 1
                const selectAt = (i: number) => {
                  const n = list.length
                  if (!n) return
                  const j = ((i % n) + n) % n
                  setPersonaIdx(j)
                  setSelectedPersonas([list[j].id])
                  setSettings(list[j].defaults)
                }
                if (!p) return null
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectAt(idx - 1)}
                        className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700", !multi && "invisible")}
                      >
                        <ChevronLeft className="h-[18px] w-[18px]" />
                      </button>
                      <div className="flex flex-1 gap-4 rounded-2xl border-2 border-blue-600 bg-blue-50/40 p-4 shadow-sm">
                        <div className="relative aspect-[3/4] w-40 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 9px, rgba(100,116,139,0.08) 9px 18px)" }} />
                          <div className="relative flex h-full flex-col items-center justify-center gap-1.5 text-slate-400">
                            <Icon className="h-8 w-8" />
                            <span className="text-[9px]">면접관 이미지</span>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/55 to-transparent p-2.5">
                            <span className="block truncate text-sm font-bold text-white drop-shadow">{p.title}</span>
                          </div>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[15px] font-bold text-slate-900">{p.title}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{p.subtitle}</p>
                            </div>
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                              <Check className="h-3 w-3" />{isTech ? "자동 배정" : "선택됨"}
                            </span>
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-slate-600">{p.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectAt(idx + 1)}
                        className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700", !multi && "invisible")}
                      >
                        <ChevronRight className="h-[18px] w-[18px]" />
                      </button>
                    </div>
                    {multi && (
                      <div className="flex items-center justify-center gap-1.5">
                        {list.map((_, i) => (
                          <span key={i} className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-4 bg-blue-600" : "w-1.5 bg-slate-300")} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Advanced Settings */}
              {selectedPersonas.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 transition-colors hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      상세 설정 (선택 사항)
                    </span>
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      {/* 압박 강도 (0~10) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-500">압박 강도</Label>
                          <span className="text-xs font-medium text-slate-900">{settings.pressure}/10</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[10px] text-slate-500">편안함</span>
                          <Slider value={[settings.pressure]} onValueChange={(v) => setSettings(prev => ({ ...prev, pressure: v[0] }))} max={10} min={0} step={1} className="flex-1" />
                          <span className="w-12 text-right text-[10px] text-slate-500">압박</span>
                        </div>
                      </div>

                      {/* 꼬리질문 (0~5) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-500">꼬리질문</Label>
                          <span className="text-xs font-medium text-slate-900">{settings.followUp}/5</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[10px] text-slate-500">적음</span>
                          <Slider value={[settings.followUp]} onValueChange={(v) => setSettings(prev => ({ ...prev, followUp: v[0] }))} max={5} min={0} step={1} className="flex-1" />
                          <span className="w-12 text-right text-[10px] text-slate-500">많음</span>
                        </div>
                      </div>

                      {/* 난이도 (EASY/NORMAL/HARD) */}
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500">난이도</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {([["EASY", "기본"], ["NORMAL", "보통"], ["HARD", "심화"]] as const).map(([val, label]) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSettings(prev => ({ ...prev, difficulty: val }))}
                              className={cn(
                                "h-9 rounded-lg border text-xs font-medium transition-all",
                                settings.difficulty === val
                                  ? "bg-blue-50 border-blue-600 text-blue-700"
                                  : "border-slate-200 text-slate-500 hover:border-blue-300"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 질문 개수 (1~20) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-slate-500">질문 개수</Label>
                          <span className="text-xs font-medium text-slate-900">{interviewCount}개</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[10px] text-slate-500">1개</span>
                          <Slider value={[interviewCount]} onValueChange={(v) => setInterviewCount(v[0])} max={20} min={1} step={1} className="flex-1" />
                          <span className="w-12 text-right text-[10px] text-slate-500">20개</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5 (1:1): Final Review */}
          {step === 5 && !isGroup && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">면접 준비 완료</h3>
                <p className="mt-1 text-sm text-slate-500">설정을 확인하고 면접을 시작하세요</p>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">자기소개서</span>
                  <span className="text-sm font-medium text-slate-900">
                    {currentIntro?.companyName} - {currentIntro?.jobPosition}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">면접 단계</span>
                  <span className="text-sm font-medium text-slate-900">{currentStage?.title}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">모드</span>
                  <Badge variant="outline" className={cn(
                    selectedPracticeMode === "practice"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {selectedPracticeMode === "practice" ? "연습 모드" : "실전 모드"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">면접 방식</span>
                  <span className="text-sm font-medium text-slate-900">{currentMode?.title}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">이력서</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedResume ? resumes.find(d => d.id === selectedResume)?.originalFilename : resumes.find(d => d.isRepresentative)?.originalFilename ?? "없음"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">포트폴리오</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedPortfolio ? portfolios.find(d => d.id === selectedPortfolio)?.originalFilename : portfolios.find(d => d.isRepresentative)?.originalFilename ?? "없음"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-500">면접관 성향</span>
                  <div className="flex gap-1">
                    {selectedPersonas.length > 0 ? (
                      selectedPersonas.map(pId => {
                        const p = personas.find(x => x.id === pId)
                        return p ? (
                          <Badge key={pId} variant="outline" className="text-xs">{p.title}</Badge>
                        ) : null
                      })
                    ) : (
                      <span className="text-sm text-slate-500">기본 설정</span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={async () => {
                  if (!currentIntro || !selectedStage || !selectedMode) return
                  setStarting(true)
                  try {
                    const interviewType = selectedStage === "technical" ? "TECHNICAL" : "PERSONALITY"

                    const { roomId } = await setupInterview({
                      siId: currentIntro.id,
                      resumeId: selectedResume ?? undefined,
                      portfolioId: selectedPortfolio ?? undefined,
                      companyName: currentIntro.companyName,
                      jobPosition: currentIntro.jobPosition,
                      interviewType,
                      interviewMode: selectedPracticeMode.toUpperCase(),
                      interviewFormat: "ONE_ON_ONE",
                      aiInterviewer: selectedPersonas[0] || "TEAM_LEAD",
                      interviewCount,
                      difficulty: settings.difficulty,
                      pressureLevel: settings.pressure,
                      followupCount: settings.followUp,
                    })

                    const { sessionId, interviewer } = await startInterview(roomId)
                    handleClose()
                    const params = new URLSearchParams({
                      mode: selectedPracticeMode,
                      sessionId: String(sessionId),
                      company: currentIntro.companyName,
                      role: currentIntro.jobPosition,
                      aiInterviewer: selectedPersonas[0] || "TEAM_LEAD",
                    })
                    if (currentStage?.title) params.set("stage", currentStage.title)
                    if (interviewer?.speakingVideoUrl) params.set("speakingVideoUrl", interviewer.speakingVideoUrl)
                    if (interviewer?.silenceVideoUrl) params.set("silenceVideoUrl", interviewer.silenceVideoUrl)
                    router.push(`/interview?${params.toString()}`)
                  } catch {
                    setStarting(false)
                  }
                }}
                disabled={starting}
                className="w-full gap-2 py-6 text-base font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    면접 준비 중...
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    면접 시작하기
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ===================== 토론 분기 ===================== */}

          {/* Step 2 (토론): Self Introduction Selection */}
          {step === 2 && isGroup && (
            <div className="space-y-3">
              <p className="mb-4 text-sm text-slate-500">
                토론에 참고할 자기소개서를 선택해주세요. 선택한 자기소개서의 기업 관련 뉴스를 참고해 주제를 추천/생성합니다.
              </p>
              {loadingIntros ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              ) : selfIntros.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  자기소개서가 없습니다. 먼저 자기소개서를 작성해주세요.
                </div>
              ) : selfIntros.map((intro) => (
                <div
                  key={intro.id}
                  onClick={() => setSelectedDebateIntro(intro.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-300",
                    selectedDebateIntro === intro.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    selectedDebateIntro === intro.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{intro.companyName}</p>
                      <Badge variant="outline" className="text-[10px] border-slate-200">{careerLabels[intro.careerLevel] ?? intro.careerLevel}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {intro.jobPosition} &middot; {intro.itemCount}개 문항
                    </p>
                  </div>
                  {selectedDebateIntro === intro.id && (
                    <Badge className="border-blue-200 bg-blue-100 text-blue-700">선택됨</Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 3 (토론): Topic Selection */}
          {step === 3 && isGroup && (
            <div className="space-y-4">
              {currentDebateIntro && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Newspaper className="h-3.5 w-3.5" />
                  <span>{currentDebateIntro.companyName}</span> 관련 뉴스를 참고합니다
                </div>
              )}

              {/* 목록 / 최신 이슈 추천 전환 */}
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setTopicMode("list")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
                    topicMode === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  주제 목록
                </button>
                <button
                  onClick={() => setTopicMode("suggest")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
                    topicMode === "suggest" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  최신 이슈로 추천
                </button>
              </div>

              {/* ── 정적 목록 ── */}
              {topicMode === "list" && (
                loadingDebate ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <>
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={categoryFilter === "all" ? "default" : "outline"}
                          onClick={() => setCategoryFilter("all")}
                        >
                          전체
                        </Button>
                        {categories.map(cat => (
                          <Button
                            key={cat}
                            size="sm"
                            variant={categoryFilter === cat ? "default" : "outline"}
                            onClick={() => setCategoryFilter(cat)}
                          >
                            {categoryLabel[cat] ?? cat}
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredTopics.map(topic => (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic)}
                          className={cn(
                            "rounded-xl border p-4 text-left transition-all",
                            selectedTopic?.id === topic.id
                              ? "border-blue-600 bg-blue-50"
                              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{topic.title}</h3>
                            <Badge variant="outline" className="shrink-0 text-[10px]">{categoryLabel[topic.category] ?? topic.category}</Badge>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{topic.description}</p>
                        </button>
                      ))}
                    </div>

                    {filteredTopics.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-500">주제가 없습니다</p>
                    )}
                  </>
                )
              )}

              {/* ── 최신 이슈 추천 ── */}
              {topicMode === "suggest" && (
                generatedTopic ? (
                  /* 생성 완료 — 이후 다음 단계로 진행 */
                  <div className="space-y-4">
                    <div className="rounded-xl border border-blue-600 bg-blue-50 p-4">
                      <div className="mb-1.5 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">생성된 주제</span>
                        <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                          {categoryLabel[generatedTopic.category] ?? generatedTopic.category}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{generatedTopic.title}</h3>
                      <p className="mt-1.5 text-xs text-slate-500">{generatedTopic.description}</p>
                      {(generatedTopic.proKeyPoints?.length > 0 || generatedTopic.conKeyPoints?.length > 0) && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <p className="mb-1 text-[11px] font-medium text-blue-500">찬성 논거</p>
                            <ul className="space-y-0.5">
                              {(generatedTopic.proKeyPoints ?? []).slice(0, 3).map((p, i) => (
                                <li key={i} className="text-[11px] text-slate-500">- {p}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] font-medium text-rose-500">반대 논거</p>
                            <ul className="space-y-0.5">
                              {(generatedTopic.conKeyPoints ?? []).slice(0, 3).map((p, i) => (
                                <li key={i} className="text-[11px] text-slate-500">- {p}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setGeneratedTopic(null)
                        setSelectedTopic(null)
                        setSelectedCandidate(null)
                      }}
                      className="text-xs text-slate-500 underline-offset-2 hover:underline"
                    >
                      다른 주제로 다시 추천받기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 키워드 입력 */}
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">
                        관심 키워드를 넣으면 더 맞춤한 주제를 추천해요 <span className="text-xs">(선택)</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {keywords.map(kw => (
                          <Badge key={kw} variant="secondary" className="gap-1 pr-1 text-xs">
                            {kw}
                            <button onClick={() => setKeywords(prev => prev.filter(k => k !== kw))} className="rounded-full p-0.5 hover:bg-slate-200/60">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        <input
                          value={keywordInput}
                          onChange={e => setKeywordInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); addKeyword(keywordInput) }
                          }}
                          placeholder="키워드 입력 후 Enter"
                          className="min-w-[120px] flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {KEYWORD_PRESETS.filter(p => !keywords.includes(p)).map(p => (
                          <button
                            key={p}
                            onClick={() => addKeyword(p)}
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition-colors hover:border-blue-300 hover:text-slate-900"
                          >
                            + {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 추천 개수 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">추천 개수</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setSuggestCount(n)}
                            className={cn(
                              "h-8 w-8 rounded-lg border text-xs font-medium transition-all",
                              suggestCount === n
                                ? "border-blue-600 bg-blue-50 text-blue-600"
                                : "border-slate-200 text-slate-500 hover:border-blue-300"
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button onClick={handleSuggest} disabled={suggesting} className="w-full gap-2">
                      {suggesting ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> 최신 뉴스 분석 중...</>
                      ) : (
                        <><Sparkles className="h-4 w-4" /> 주제 추천받기</>
                      )}
                    </Button>

                    {topicError && (
                      <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                        {topicError}
                      </p>
                    )}

                    {/* 후보 목록 */}
                    {candidates.length > 0 && (
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        {newsCount !== null && (
                          <p className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Newspaper className="h-3.5 w-3.5" />
                            최근 뉴스 {newsCount}건 기반 추천
                          </p>
                        )}
                        <div className="grid gap-3">
                          {candidates.map((c, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedCandidate(c)}
                              className={cn(
                                "rounded-xl border p-4 text-left transition-all",
                                selectedCandidate === c
                                  ? "border-blue-600 bg-blue-50"
                                  : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
                                <Badge variant="outline" className="shrink-0 text-[10px]">{categoryLabel[c.category] ?? c.category}</Badge>
                              </div>
                              <p className="mt-1.5 text-xs text-slate-500">{c.description}</p>
                            </button>
                          ))}
                        </div>
                        <Button onClick={handleGenerate} disabled={!selectedCandidate || generating} className="w-full gap-2">
                          {generating ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> 주제 생성 중... (최대 수십 초)</>
                          ) : (
                            "이 주제로 생성하기"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Step 4 (토론): Stance Selection */}
          {step === 4 && isGroup && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{selectedTopic?.title}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setSelectedStance("PRO")}
                  className={cn(
                    "rounded-xl border p-5 text-left transition-all",
                    selectedStance === "PRO"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-200 hover:border-blue-500/30"
                  )}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                      <Target className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900">찬성</h3>
                  </div>
                  {/* 실전(real) 모드는 근거 숨김 — 데이터는 받되 화면에만 노출하지 않는다 */}
                  {selectedPracticeMode === "real" ? (
                    <p className="text-xs text-slate-400">실전 모드에서는 근거가 제공되지 않습니다</p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedTopic?.proKeyPoints.map((point, i) => (
                        <li key={i} className="text-xs text-slate-500">- {point}</li>
                      ))}
                    </ul>
                  )}
                </button>

                <button
                  onClick={() => setSelectedStance("CON")}
                  className={cn(
                    "rounded-xl border p-5 text-left transition-all",
                    selectedStance === "CON"
                      ? "border-rose-500 bg-rose-500/10"
                      : "border-slate-200 hover:border-rose-500/30"
                  )}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10">
                      <Swords className="h-4 w-4 text-rose-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900">반대</h3>
                  </div>
                  {/* 실전(real) 모드는 근거 숨김 — 데이터는 받되 화면에만 노출하지 않는다 */}
                  {selectedPracticeMode === "real" ? (
                    <p className="text-xs text-slate-400">실전 모드에서는 근거가 제공되지 않습니다</p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedTopic?.conKeyPoints.map((point, i) => (
                        <li key={i} className="text-xs text-slate-500">- {point}</li>
                      ))}
                    </ul>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5 (토론): Persona Selection */}
          {step === 5 && isGroup && (() => {
            const list = debatePersonas
            const idx = Math.min(dpIdx, Math.max(list.length - 1, 0))
            const p = list[idx]
            const multi = list.length > 1
            const selectAt = (i: number) => {
              const n = list.length
              if (!n) return
              const j = ((i % n) + n) % n
              setDpIdx(j)
              setSelectedDebatePersona(list[j])
            }
            return (
              <div className="space-y-5">
                <p className="text-center text-[15px] font-semibold leading-relaxed text-slate-900">함께 토론할 상대를 선택해주세요</p>
                {list.length === 0 || !p ? (
                  <p className="py-8 text-center text-sm text-slate-400">토론 상대를 불러오는 중입니다</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectAt(idx - 1)}
                        className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700", !multi && "invisible")}
                      >
                        <ChevronLeft className="h-[18px] w-[18px]" />
                      </button>
                      <div className="flex flex-1 gap-4 rounded-2xl border-2 border-blue-600 bg-blue-50/40 p-4 shadow-sm">
                        <div className="relative aspect-[3/4] w-40 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 9px, rgba(100,116,139,0.08) 9px 18px)" }} />
                          <div className="relative flex h-full flex-col items-center justify-center gap-1.5 text-slate-400">
                            <Users className="h-8 w-8" />
                            <span className="text-[9px]">토론 상대 이미지</span>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/55 to-transparent p-2.5">
                            <span className="block truncate text-sm font-bold text-white drop-shadow">{p.name}</span>
                          </div>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[15px] font-bold text-slate-900">{p.name}</p>
                              <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{p.difficulty}</span>
                            </div>
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white"><Check className="h-3 w-3" />선택됨</span>
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-slate-600">{p.background}</p>
                          <p className="mt-2 text-xs text-slate-400">스타일: {p.debateStyle}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectAt(idx + 1)}
                        className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700", !multi && "invisible")}
                      >
                        <ChevronRight className="h-[18px] w-[18px]" />
                      </button>
                    </div>
                    {multi && (
                      <div className="flex items-center justify-center gap-1.5">
                        {list.map((_, i) => (
                          <span key={i} className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-4 bg-blue-600" : "w-1.5 bg-slate-300")} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })()}

          {/* Step 6 (토론): Difficulty + Confirm */}
          {step === 6 && isGroup && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">토론 준비 완료</h3>
                <p className="mt-1 text-sm text-slate-500">난이도를 확인하고 토론을 시작하세요</p>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">모드</span>
                  <Badge variant="outline" className={cn(
                    selectedPracticeMode === "practice"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {selectedPracticeMode === "practice" ? "연습 모드" : "실전 모드"}
                  </Badge>
                </div>
                {currentDebateIntro && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">참고 기업</span>
                    <span className="text-sm font-medium text-slate-900">{currentDebateIntro.companyName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">주제</span>
                  <span className="text-sm font-medium text-slate-900 text-right">{selectedTopic?.title}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">입장</span>
                  <Badge variant={selectedStance === "PRO" ? "default" : "secondary"}>
                    {selectedStance === "PRO" ? "찬성" : "반대"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">상대</span>
                  <span className="text-sm font-medium text-slate-900">{selectedDebatePersona?.name}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-500">난이도</span>
                  <div className="grid grid-cols-3 gap-2">
                    {([["EASY", "쉬움"], ["NORMAL", "보통"], ["HARD", "어려움"]] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDebateDifficulty(val)}
                        className={cn(
                          "h-8 rounded-lg border px-3 text-xs font-medium transition-all",
                          debateDifficulty === val
                            ? "bg-blue-50 border-blue-600 text-blue-700"
                            : "border-slate-200 text-slate-500 hover:border-blue-300"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (!selectedTopic || !selectedStance || !selectedDebatePersona) return
                  handleClose()
                  // topicTitle: 생성된 주제는 정적 목록에 없어 /debate에서 배너 제목을 못 찾으므로 폴백으로 전달
                  const q = new URLSearchParams({
                    topicId: String(selectedTopic.id),
                    stance: selectedStance,
                    personaId: String(selectedDebatePersona.id),
                    difficulty: debateDifficulty,
                    mode: selectedPracticeMode,
                    topicTitle: selectedTopic.title,
                  })
                  if (selectedDebateIntro !== null) q.set("introId", String(selectedDebateIntro))
                  router.push(`/debate?${q.toString()}`)
                }}
                className="w-full gap-2 py-6 text-base font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              >
                <Mic className="h-5 w-5" />
                토론 시작하기
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {step <= totalSteps && (
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              이전
            </Button>
            {step < totalSteps && (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="gap-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                다음
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
