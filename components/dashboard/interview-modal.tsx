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
    color: "bg-foreground",
  },
  {
    id: "EXECUTIVE",
    title: "임원형",
    subtitle: "사업부장/본부장",
    icon: Crown,
    description: "동기, 태도, 성장 가능성, 조직 적합성",
    defaults: { pressure: 5, followUp: 4, difficulty: "NORMAL" },
    color: "bg-foreground",
  },
  {
    id: "HR_MANAGER",
    title: "인성면접관",
    subtitle: "HR/문화 적합성",
    icon: Heart,
    description: "갈등 해결, 피드백 수용, 가치관",
    defaults: { pressure: 3, followUp: 4, difficulty: "EASY" },
    color: "bg-foreground",
  },
  {
    id: "TECH_INTERVIEWER",
    title: "기술면접관",
    subtitle: "CTO/테크리드",
    icon: Code,
    description: "아키텍처, 트레이드오프, 예외 상황 대응",
    defaults: { pressure: 6, followUp: 5, difficulty: "HARD" },
    color: "bg-foreground",
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
  const [starting, setStarting] = useState(false)
  const [selfIntros, setSelfIntros] = useState<SelfIntroResponse[]>([])
  const [loadingIntros, setLoadingIntros] = useState(false)
  const [resumes, setResumes] = useState<DocumentItem[]>([])
  const [portfolios, setPortfolios] = useState<DocumentItem[]>([])
  const [selectedResume, setSelectedResume] = useState<number | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  // 토론
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
    try {
      const res = await suggestDebateTopics({ keywords, count: suggestCount })
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

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep(1)
      setSelectedMode(null)
      setSelectedPracticeMode("practice")
      setSelectedIntro(null)
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

  const handleNext = () => {
    if (step < 5) setStep(step + 1)
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

  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev => {
      if (prev.includes(personaId)) {
        return prev.filter(id => id !== personaId)
      } else {
        // 1:1은 1명만 선택
        if (prev.length >= 1) {
          return [personaId]
        }
        return [...prev, personaId]
      }
    })
  }

  const canProceed =
    (step === 1 && selectedMode !== null) ||
    (isGroup
      ? (step === 2 && selectedTopic !== null) ||
        (step === 3 && selectedStance !== null) ||
        (step === 4 && selectedDebatePersona !== null) ||
        step === 5
      : (step === 2 && selectedIntro !== null) ||
        (step === 3 && selectedStage !== null) ||
        step === 4 || // Persona is optional
        step === 5)

  const currentIntro = selfIntros.find(i => i.id === selectedIntro)
  const currentStage = interviewStages.find(s => s.id === selectedStage)
  const currentMode = interviewModes.find(m => m.id === selectedMode)

  const stepLabels = isGroup
    ? ["면접 방식", "토론 주제", "입장 선택", "토론 상대", "난이도 · 확인"]
    : ["면접 방식", "자기소개서 선택", "면접 단계", "면접관 페르소나", "최종 확인"]

  const categories = [...new Set(debateTopics.map(t => t.category))]
  const filteredTopics = categoryFilter === "all"
    ? debateTopics
    : debateTopics.filter(t => t.category === categoryFilter)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            면접 시작하기
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            면접 방식과 설정을 선택하고 AI 모의 면접을 시작하세요
          </DialogDescription>
        </DialogHeader>

        {/* Clickable Progress Indicator */}
        <div className="flex items-center gap-1.5 py-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => goToStep(s)}
              disabled={s > step}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                s === step
                  ? "bg-primary text-white"
                  : s < step
                  ? "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              )}
            >
              {s < step ? <Check className="h-3.5 w-3.5" /> : s}
            </button>
          ))}
          <div className="ml-3 text-sm text-muted-foreground">
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
                <h4 className="mb-3 text-sm font-medium text-foreground">모드 선택</h4>
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
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/30 hover:bg-secondary/50"
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          isSelected
                            ? `${mode.color} text-white`
                            : "bg-secondary text-muted-foreground"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{mode.title}</p>
                          <p className="text-[11px] text-muted-foreground">{mode.description}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
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
                <h4 className="mb-3 text-sm font-medium text-foreground">면접 방식</h4>
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
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                            : "border-border hover:border-primary/40 hover:bg-secondary/50"
                        )}
                      >
                        <div className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl transition-all",
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-secondary text-muted-foreground"
                        )}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-foreground">{mode.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
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
              <p className="mb-4 text-sm text-muted-foreground">
                면접에 사용할 자기소개서를 선택해주세요
              </p>
              {loadingIntros ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : selfIntros.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  자기소개서가 없습니다. 먼저 자기소개서를 작성해주세요.
                </div>
              ) : selfIntros.map((intro) => (
                <div
                  key={intro.id}
                  onClick={() => setSelectedIntro(intro.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-300",
                    selectedIntro === intro.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border hover:border-primary/30 hover:bg-secondary/50"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    selectedIntro === intro.id
                      ? "bg-primary text-white"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{intro.companyName}</p>
                      <Badge variant="outline" className="text-[10px] border-border">{careerLabels[intro.careerLevel] ?? intro.careerLevel}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {intro.jobPosition} &middot; {intro.itemCount}개 문항
                    </p>
                  </div>
                  {selectedIntro === intro.id && (
                    <Badge className="border-primary/30 bg-primary/20 text-primary">선택됨</Badge>
                  )}
                </div>
              ))}

              {/* 이력서 / 포트폴리오 선택 */}
              {selectedIntro !== null && (
                <div className="mt-6 space-y-4 border-t border-border/30 pt-4">
                  <p className="text-sm text-muted-foreground">
                    이력서 / 포트폴리오 선택 <span className="text-xs">(선택하지 않으면 대표 문서 사용)</span>
                  </p>

                  {loadingDocs ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {/* 이력서 */}
                      <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          이력서
                        </p>
                        {resumes.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">등록된 이력서가 없습니다</p>
                        ) : resumes.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedResume(selectedResume === doc.id ? null : doc.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-all",
                              selectedResume === doc.id
                                ? "border-primary/50 bg-primary/10"
                                : "border-border hover:border-primary/30 hover:bg-secondary/50"
                            )}
                          >
                            <span className="flex-1 truncate text-foreground">{doc.originalFilename}</span>
                            {doc.isRepresentative && (
                              <Badge variant="outline" className="text-[9px] shrink-0">대표</Badge>
                            )}
                            {selectedResume === doc.id && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* 포트폴리오 */}
                      <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <FolderOpen className="h-3.5 w-3.5" />
                          포트폴리오
                        </p>
                        {portfolios.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">등록된 포트폴리오가 없습니다</p>
                        ) : portfolios.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedPortfolio(selectedPortfolio === doc.id ? null : doc.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-all",
                              selectedPortfolio === doc.id
                                ? "border-primary/50 bg-primary/10"
                                : "border-border hover:border-primary/30 hover:bg-secondary/50"
                            )}
                          >
                            <span className="flex-1 truncate text-foreground">{doc.originalFilename}</span>
                            {doc.isRepresentative && (
                              <Badge variant="outline" className="text-[9px] shrink-0">대표</Badge>
                            )}
                            {selectedPortfolio === doc.id && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
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
              <p className="text-sm text-muted-foreground">
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
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:bg-secondary/50"
                    )}
                  >
                    <span className="text-sm font-medium">{stage.title}</span>
                    <span className="text-[10px] opacity-70">{stage.description}</span>
                  </button>
                ))}
              </div>

              {selectedIntro && (
                <div className="mt-6 rounded-lg border border-border/30 bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">선택된 자기소개서</p>
                  <p className="text-sm font-medium text-foreground">
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
                <p className="text-sm text-muted-foreground">
                  AI 면접관의 성향을 선택해주세요
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  선택하지 않으면 기본 면접관으로 진행됩니다
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {personas.map((persona) => {
                  const Icon = persona.icon
                  const isSelected = selectedPersonas.includes(persona.id)
                  return (
                    <button
                      key={persona.id}
                      onClick={() => togglePersona(persona.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-200",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30 hover:bg-secondary/50"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isSelected ? persona.color : "bg-secondary",
                        isSelected ? "text-white" : "text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-foreground">{persona.title}</span>
                      <span className="text-[10px] text-muted-foreground">{persona.subtitle}</span>
                    </button>
                  )
                })}
              </div>

              {/* Advanced Settings */}
              {selectedPersonas.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/50"
                  >
                    <span className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      상세 설정 (선택 사항)
                    </span>
                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                      {/* 압박 강도 (0~10) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">압박 강도</Label>
                          <span className="text-xs font-medium text-foreground">{settings.pressure}/10</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[10px] text-muted-foreground">편안함</span>
                          <Slider value={[settings.pressure]} onValueChange={(v) => setSettings(prev => ({ ...prev, pressure: v[0] }))} max={10} min={0} step={1} className="flex-1" />
                          <span className="w-12 text-right text-[10px] text-muted-foreground">압박</span>
                        </div>
                      </div>

                      {/* 꼬리질문 (0~5) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">꼬리질문</Label>
                          <span className="text-xs font-medium text-foreground">{settings.followUp}/5</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[10px] text-muted-foreground">적음</span>
                          <Slider value={[settings.followUp]} onValueChange={(v) => setSettings(prev => ({ ...prev, followUp: v[0] }))} max={5} min={0} step={1} className="flex-1" />
                          <span className="w-12 text-right text-[10px] text-muted-foreground">많음</span>
                        </div>
                      </div>

                      {/* 난이도 (EASY/NORMAL/HARD) */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">난이도</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {([["EASY", "기본"], ["NORMAL", "보통"], ["HARD", "심화"]] as const).map(([val, label]) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSettings(prev => ({ ...prev, difficulty: val }))}
                              className={cn(
                                "h-9 rounded-lg border text-xs font-medium transition-all",
                                settings.difficulty === val
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/30"
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
                          <Label className="text-xs text-muted-foreground">질문 개수</Label>
                          <span className="text-xs font-medium text-foreground">{interviewCount}개</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-[10px] text-muted-foreground">1개</span>
                          <Slider value={[interviewCount]} onValueChange={(v) => setInterviewCount(v[0])} max={20} min={1} step={1} className="flex-1" />
                          <span className="w-12 text-right text-[10px] text-muted-foreground">20개</span>
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
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">면접 준비 완료</h3>
                <p className="mt-1 text-sm text-muted-foreground">설정을 확인하고 면접을 시작하세요</p>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">자기소개서</span>
                  <span className="text-sm font-medium text-foreground">
                    {currentIntro?.companyName} - {currentIntro?.jobPosition}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">면접 단계</span>
                  <span className="text-sm font-medium text-foreground">{currentStage?.title}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">모드</span>
                  <Badge variant="outline" className={cn(
                    selectedPracticeMode === "practice"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  )}>
                    {selectedPracticeMode === "practice" ? "연습 모드" : "실전 모드"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">면접 방식</span>
                  <span className="text-sm font-medium text-foreground">{currentMode?.title}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">이력서</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedResume ? resumes.find(d => d.id === selectedResume)?.originalFilename : resumes.find(d => d.isRepresentative)?.originalFilename ?? "없음"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">포트폴리오</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedPortfolio ? portfolios.find(d => d.id === selectedPortfolio)?.originalFilename : portfolios.find(d => d.isRepresentative)?.originalFilename ?? "없음"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">면접관 성향</span>
                  <div className="flex gap-1">
                    {selectedPersonas.length > 0 ? (
                      selectedPersonas.map(pId => {
                        const p = personas.find(x => x.id === pId)
                        return p ? (
                          <Badge key={pId} variant="outline" className="text-xs">{p.title}</Badge>
                        ) : null
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">기본 설정</span>
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

                    const { sessionId } = await startInterview(roomId)
                    handleClose()
                    router.push(`/interview?mode=${selectedPracticeMode}&sessionId=${sessionId}`)
                  } catch {
                    setStarting(false)
                  }
                }}
                disabled={starting}
                className="w-full gap-2 py-6 text-base font-semibold bg-foreground text-background shadow-lg hover:bg-foreground/90"
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

          {/* Step 2 (토론): Topic Selection */}
          {step === 2 && isGroup && (
            <div className="space-y-4">
              {/* 목록 / 최신 이슈 추천 전환 */}
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-secondary/30 p-1">
                <button
                  onClick={() => setTopicMode("list")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
                    topicMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  주제 목록
                </button>
                <button
                  onClick={() => setTopicMode("suggest")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
                    topicMode === "suggest" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
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
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/30 hover:bg-secondary/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{topic.title}</h3>
                            <Badge variant="outline" className="shrink-0 text-[10px]">{categoryLabel[topic.category] ?? topic.category}</Badge>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{topic.description}</p>
                        </button>
                      ))}
                    </div>

                    {filteredTopics.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">주제가 없습니다</p>
                    )}
                  </>
                )
              )}

              {/* ── 최신 이슈 추천 ── */}
              {topicMode === "suggest" && (
                generatedTopic ? (
                  /* 생성 완료 — 이후 다음 단계로 진행 */
                  <div className="space-y-4">
                    <div className="rounded-xl border border-primary/50 bg-primary/10 p-4">
                      <div className="mb-1.5 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">생성된 주제</span>
                        <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                          {categoryLabel[generatedTopic.category] ?? generatedTopic.category}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{generatedTopic.title}</h3>
                      <p className="mt-1.5 text-xs text-muted-foreground">{generatedTopic.description}</p>
                      {(generatedTopic.proKeyPoints?.length > 0 || generatedTopic.conKeyPoints?.length > 0) && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <p className="mb-1 text-[11px] font-medium text-blue-500">찬성 논거</p>
                            <ul className="space-y-0.5">
                              {generatedTopic.proKeyPoints?.slice(0, 3).map((p, i) => (
                                <li key={i} className="text-[11px] text-muted-foreground">- {p}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] font-medium text-rose-500">반대 논거</p>
                            <ul className="space-y-0.5">
                              {generatedTopic.conKeyPoints?.slice(0, 3).map((p, i) => (
                                <li key={i} className="text-[11px] text-muted-foreground">- {p}</li>
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
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      다른 주제로 다시 추천받기
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 키워드 입력 */}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        관심 키워드를 넣으면 더 맞춤한 주제를 추천해요 <span className="text-xs">(선택)</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {keywords.map(kw => (
                          <Badge key={kw} variant="secondary" className="gap-1 pr-1 text-xs">
                            {kw}
                            <button onClick={() => setKeywords(prev => prev.filter(k => k !== kw))} className="rounded-full p-0.5 hover:bg-foreground/10">
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
                          className="min-w-[120px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {KEYWORD_PRESETS.filter(p => !keywords.includes(p)).map(p => (
                          <button
                            key={p}
                            onClick={() => addKeyword(p)}
                            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                          >
                            + {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 추천 개수 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">추천 개수</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setSuggestCount(n)}
                            className={cn(
                              "h-8 w-8 rounded-lg border text-xs font-medium transition-all",
                              suggestCount === n
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/30"
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
                      <div className="space-y-3 border-t border-border/30 pt-4">
                        {newsCount !== null && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/30 hover:bg-secondary/50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                                <Badge variant="outline" className="shrink-0 text-[10px]">{categoryLabel[c.category] ?? c.category}</Badge>
                              </div>
                              <p className="mt-1.5 text-xs text-muted-foreground">{c.description}</p>
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

          {/* Step 3 (토론): Stance Selection */}
          {step === 3 && isGroup && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedTopic?.title}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setSelectedStance("PRO")}
                  className={cn(
                    "rounded-xl border p-5 text-left transition-all",
                    selectedStance === "PRO"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border hover:border-blue-500/30"
                  )}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                      <Target className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-foreground">찬성</h3>
                  </div>
                  <ul className="space-y-1">
                    {selectedTopic?.proKeyPoints.map((point, i) => (
                      <li key={i} className="text-xs text-muted-foreground">- {point}</li>
                    ))}
                  </ul>
                </button>

                <button
                  onClick={() => setSelectedStance("CON")}
                  className={cn(
                    "rounded-xl border p-5 text-left transition-all",
                    selectedStance === "CON"
                      ? "border-rose-500 bg-rose-500/10"
                      : "border-border hover:border-rose-500/30"
                  )}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10">
                      <Swords className="h-4 w-4 text-rose-500" />
                    </div>
                    <h3 className="font-semibold text-foreground">반대</h3>
                  </div>
                  <ul className="space-y-1">
                    {selectedTopic?.conKeyPoints.map((point, i) => (
                      <li key={i} className="text-xs text-muted-foreground">- {point}</li>
                    ))}
                  </ul>
                </button>
              </div>
            </div>
          )}

          {/* Step 4 (토론): Persona Selection */}
          {step === 4 && isGroup && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">토론 상대를 선택해주세요</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {debatePersonas.map(persona => (
                  <button
                    key={persona.id}
                    onClick={() => setSelectedDebatePersona(persona)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      selectedDebatePersona?.id === persona.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30 hover:bg-secondary/50"
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">{persona.name}</h3>
                      <Badge variant="secondary" className="text-[10px]">{persona.difficulty}</Badge>
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">{persona.background}</p>
                    <p className="text-xs text-muted-foreground/70">스타일: {persona.debateStyle}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 (토론): Difficulty + Confirm */}
          {step === 5 && isGroup && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">토론 준비 완료</h3>
                <p className="mt-1 text-sm text-muted-foreground">난이도를 확인하고 토론을 시작하세요</p>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">모드</span>
                  <Badge variant="outline" className={cn(
                    selectedPracticeMode === "practice"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  )}>
                    {selectedPracticeMode === "practice" ? "연습 모드" : "실전 모드"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">주제</span>
                  <span className="text-sm font-medium text-foreground text-right">{selectedTopic?.title}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">입장</span>
                  <Badge variant={selectedStance === "PRO" ? "default" : "secondary"}>
                    {selectedStance === "PRO" ? "찬성" : "반대"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">상대</span>
                  <span className="text-sm font-medium text-foreground">{selectedDebatePersona?.name}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">난이도</span>
                  <div className="grid grid-cols-3 gap-2">
                    {([["EASY", "쉬움"], ["NORMAL", "보통"], ["HARD", "어려움"]] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDebateDifficulty(val)}
                        className={cn(
                          "h-8 rounded-lg border px-3 text-xs font-medium transition-all",
                          debateDifficulty === val
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"
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
                  router.push(`/debate?${q.toString()}`)
                }}
                className="w-full gap-2 py-6 text-base font-semibold bg-foreground text-background shadow-lg hover:bg-foreground/90"
              >
                <Mic className="h-5 w-5" />
                토론 시작하기
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {step <= 5 && (
          <div className="flex justify-between gap-3 border-t border-border/30 pt-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              이전
            </Button>
            {step < 5 && (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="gap-1 bg-foreground text-background hover:bg-foreground/90"
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
