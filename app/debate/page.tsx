"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Users,
  Target,
  Swords,
  Trophy,
} from "lucide-react"
import {
  getDebateTopics,
  getDebatePersonas,
  createDebateSession,
  startDebateSession,
  getDebateState,
  submitDebateTurn,
  endDebateSession,
  type DebateTopic,
  type DebatePersona,
  type DebateStateResponse,
  type DebateRound,
} from "@/lib/api/debate"

const roundLabel: Record<DebateRound, string> = {
  OPENING: "개회",
  REBUTTAL_1: "반론1",
  REBUTTAL_2: "반론2",
  CLOSING: "마무리",
  MODERATION: "사회",
}

type Phase = "setup" | "debating" | "ending"
type SetupStep = 1 | 2 | 3 | 4

export default function DebatePage() {
  const router = useRouter()

  // Setup state
  const [phase, setPhase] = useState<Phase>("setup")
  const [setupStep, setSetupStep] = useState<SetupStep>(1)
  const [topics, setTopics] = useState<DebateTopic[]>([])
  const [personas, setPersonas] = useState<DebatePersona[]>([])
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null)
  const [selectedStance, setSelectedStance] = useState<"PRO" | "CON" | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<DebatePersona | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<"EASY" | "NORMAL" | "HARD">("NORMAL")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Debate state
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [debateState, setDebateState] = useState<DebateStateResponse | null>(null)
  const [userInput, setUserInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [polling, setPolling] = useState(false)
  const [pollTrigger, setPollTrigger] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playedTurnIds = useRef<Set<number>>(new Set())

  // Load topics and personas
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [t, p] = await Promise.all([getDebateTopics(), getDebatePersonas()])
        setTopics(t)
        setPersonas(p)
      } catch {
        setTopics([])
        setPersonas([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Poll debate state with adaptive interval
  const [pollTimeout, setPollTimeout] = useState(false)
  useEffect(() => {
    if (phase !== "debating" || !sessionId) return
    let cancelled = false
    let waitStart = 0

    async function poll() {
      if (cancelled) return
      setPolling(true)
      try {
        const state = await getDebateState(sessionId!)
        if (cancelled) return
        setDebateState(state)
        if (state.currentState === "FINISHED") {
          setPhase("ending")
          return
        }
        if (state.isWaitingForUser) {
          // 사용자 턴이면 폴링 중단
          setPolling(false)
          waitStart = 0
          setPollTimeout(false)
          return
        }
        // AI 응답 대기 중 — 경과 시간에 따라 간격 조정
        if (waitStart === 0) waitStart = Date.now()
        const elapsed = Date.now() - waitStart
        if (elapsed >= 180_000) {
          setPollTimeout(true)
        }
        const delay = elapsed >= 30_000 ? 5000 : 1500
        setTimeout(poll, delay)
      } catch {
        if (!cancelled) setTimeout(poll, 5000)
      } finally {
        if (!cancelled) setPolling(false)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [phase, sessionId, pollTrigger])

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [debateState?.latestTurns])

  // TTS 자동 재생 — audioUrl 있는 새 AI 턴만
  useEffect(() => {
    if (!debateState?.latestTurns) return
    const newAudioTurn = [...debateState.latestTurns]
      .reverse()
      .find(
        (t) =>
          t.speakerType !== "USER" &&
          t.audioUrl &&
          !playedTurnIds.current.has(t.id)
      )
    if (!newAudioTurn || !newAudioTurn.audioUrl) return
    playedTurnIds.current.add(newAudioTurn.id)
    audioRef.current?.pause()
    audioRef.current = new Audio(newAudioTurn.audioUrl)
    audioRef.current.play().catch(() => {})
  }, [debateState?.latestTurns])

  const filteredTopics = categoryFilter === "all"
    ? topics
    : topics.filter(t => t.category === categoryFilter)

  const categories = [...new Set(topics.map(t => t.category))]

  const canProceed = () => {
    switch (setupStep) {
      case 1: return !!selectedTopic
      case 2: return !!selectedStance
      case 3: return !!selectedPersona
      case 4: return true
      default: return false
    }
  }

  const handleCreateSession = async () => {
    if (!selectedTopic || !selectedStance || !selectedPersona) return
    setCreating(true)
    try {
      const { sessionId: sid } = await createDebateSession({
        topicId: selectedTopic.id,
        userStance: selectedStance,
        personaId: selectedPersona.id,
        difficulty: selectedDifficulty,
      })
      setSessionId(sid)
      await startDebateSession(sid)
      setPhase("debating")
    } catch {
      // 세션 생성 실패
    } finally {
      setCreating(false)
    }
  }

  const handleSubmitTurn = async () => {
    if (!sessionId || !userInput.trim() || submitting) return
    setSubmitting(true)
    try {
      await submitDebateTurn(sessionId, userInput.trim())
      setUserInput("")
      setPollTrigger(prev => prev + 1)
    } catch {
      // keep input on error
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnd = async () => {
    if (!sessionId) return
    try {
      await endDebateSession(sessionId)
      router.push(`/reports?type=debate`)
    } catch {
      router.push(`/reports?type=debate`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmitTurn()
    }
  }

  const difficultyLabel: Record<string, string> = {
    EASY: "쉬움",
    NORMAL: "보통",
    HARD: "어려움",
  }

  const categoryLabel: Record<string, string> = {
    AI_ETHICS: "AI 윤리",
    RECRUITMENT: "채용",
    DEV_CULTURE: "개발 문화",
    TECH_TREND: "기술 트렌드",
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />

      <main className="pt-14 lg:pl-64 lg:pt-0">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (phase === "setup" && setupStep > 1) {
                  setSetupStep((setupStep - 1) as SetupStep)
                } else {
                  router.push("/dashboard")
                }
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">토론 면접</h1>
              <p className="text-sm text-muted-foreground">
                {phase === "setup" && "토론 설정"}
                {phase === "debating" && "토론 진행 중"}
                {phase === "ending" && "토론 종료"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : phase === "setup" ? (
            <div className="space-y-6">
              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        step === setupStep
                          ? "bg-primary text-white"
                          : step < setupStep
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`h-0.5 w-8 ${step < setupStep ? "bg-primary/40" : "bg-border"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Topic Selection */}
              {setupStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">토론 주제 선택</h2>

                  {categories.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
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
                      <Card
                        key={topic.id}
                        className={`cursor-pointer transition-all ${
                          selectedTopic?.id === topic.id
                            ? "border-primary bg-primary/5"
                            : "border-border/50 hover:border-primary/30"
                        }`}
                        onClick={() => setSelectedTopic(topic)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{topic.title}</h3>
                            <Badge variant="outline" className="shrink-0 text-xs">{categoryLabel[topic.category] ?? topic.category}</Badge>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredTopics.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">주제가 없습니다</p>
                  )}
                </div>
              )}

              {/* Step 2: Stance Selection */}
              {setupStep === 2 && selectedTopic && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">입장 선택</h2>
                  <p className="text-sm text-muted-foreground">{selectedTopic.title}</p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card
                      className={`cursor-pointer transition-all ${
                        selectedStance === "PRO"
                          ? "border-blue-500 bg-blue-500/5"
                          : "border-border/50 hover:border-blue-500/30"
                      }`}
                      onClick={() => setSelectedStance("PRO")}
                    >
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                            <Target className="h-4 w-4 text-blue-500" />
                          </div>
                          <h3 className="font-semibold text-foreground">찬성</h3>
                        </div>
                        <ul className="space-y-1">
                          {selectedTopic.proKeyPoints.map((point, i) => (
                            <li key={i} className="text-xs text-muted-foreground">- {point}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all ${
                        selectedStance === "CON"
                          ? "border-rose-500 bg-rose-500/5"
                          : "border-border/50 hover:border-rose-500/30"
                      }`}
                      onClick={() => setSelectedStance("CON")}
                    >
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10">
                            <Swords className="h-4 w-4 text-rose-500" />
                          </div>
                          <h3 className="font-semibold text-foreground">반대</h3>
                        </div>
                        <ul className="space-y-1">
                          {selectedTopic.conKeyPoints.map((point, i) => (
                            <li key={i} className="text-xs text-muted-foreground">- {point}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Step 3: Persona Selection */}
              {setupStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">상대 면접관 선택</h2>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {personas.map(persona => (
                      <Card
                        key={persona.id}
                        className={`cursor-pointer transition-all ${
                          selectedPersona?.id === persona.id
                            ? "border-primary bg-primary/5"
                            : "border-border/50 hover:border-primary/30"
                        }`}
                        onClick={() => setSelectedPersona(persona)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">{persona.name}</h3>
                            <Badge variant="secondary" className="text-xs">{persona.difficulty}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{persona.background}</p>
                          <p className="text-xs text-muted-foreground/70">스타일: {persona.debateStyle}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Difficulty + Confirm */}
              {setupStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">설정 확인</h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                      <span className="text-sm text-muted-foreground">주제</span>
                      <span className="text-sm font-medium text-foreground">{selectedTopic?.title}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                      <span className="text-sm text-muted-foreground">입장</span>
                      <Badge variant={selectedStance === "PRO" ? "default" : "secondary"}>
                        {selectedStance === "PRO" ? "찬성" : "반대"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                      <span className="text-sm text-muted-foreground">상대</span>
                      <span className="text-sm font-medium text-foreground">{selectedPersona?.name}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                      <span className="text-sm text-muted-foreground">난이도</span>
                      <Select
                        value={selectedDifficulty}
                        onValueChange={(v) => setSelectedDifficulty(v as "EASY" | "NORMAL" | "HARD")}
                      >
                        <SelectTrigger className="w-28 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">쉬움</SelectItem>
                          <SelectItem value="NORMAL">보통</SelectItem>
                          <SelectItem value="HARD">어려움</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSetupStep((setupStep - 1) as SetupStep)}
                  disabled={setupStep === 1}
                >
                  이전
                </Button>
                {setupStep < 4 ? (
                  <Button
                    onClick={() => setSetupStep((setupStep + 1) as SetupStep)}
                    disabled={!canProceed()}
                  >
                    다음
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleCreateSession} disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      "토론 시작"
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : phase === "debating" || phase === "ending" ? (
            <div className="flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
              {/* Topic Banner */}
              <div className="mb-4 rounded-lg border border-border/50 bg-card px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedTopic?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      내 입장: {selectedStance === "PRO" ? "찬성" : "반대"} / 상대: {selectedPersona?.name} / {difficultyLabel[selectedDifficulty]}
                    </p>
                  </div>
                  {phase === "debating" && (
                    <Button variant="outline" size="sm" onClick={handleEnd}>
                      토론 종료
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-border/50 bg-card p-4">
                {debateState?.latestTurns.map((turn) => {
                  const isUser = turn.speakerType === "USER"
                  const isInterviewer = turn.speakerType === "AI_INTERVIEWER"
                  const speakerName = isUser
                    ? "나"
                    : isInterviewer
                      ? "면접관"
                      : selectedPersona?.name
                  return (
                    <div
                      key={turn.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          isUser
                            ? "bg-primary text-white"
                            : isInterviewer
                              ? "bg-amber-100 text-foreground dark:bg-amber-900/30"
                              : "bg-secondary text-foreground"
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-medium opacity-70">{speakerName}</span>
                          {turn.round && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${isUser ? "border-white/30 text-white/70" : ""}`}
                            >
                              {roundLabel[turn.round] ?? turn.round}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{turn.content}</p>
                      </div>
                    </div>
                  )
                })}

                {polling && !debateState?.isWaitingForUser && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-secondary px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{selectedPersona?.name} 응답 중...</span>
                      </div>
                    </div>
                  </div>
                )}

                {pollTimeout && !debateState?.isWaitingForUser && (
                  <div className="flex justify-center">
                    <p className="text-xs text-muted-foreground">응답이 지연되고 있습니다. 잠시만 기다려주세요.</p>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              {phase === "debating" && debateState?.isWaitingForUser && (
                <div className="mt-4 flex gap-2">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="의견을 입력하세요..."
                    className="min-h-12 max-h-32 resize-none border-border/50 bg-secondary/30"
                    disabled={submitting}
                  />
                  <Button
                    size="icon"
                    onClick={handleSubmitTurn}
                    disabled={!userInput.trim() || submitting}
                    className="h-12 w-12 shrink-0"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {/* Ending */}
              {phase === "ending" && (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-border/50 bg-card p-6">
                  <Trophy className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium text-foreground">토론이 종료되었습니다</p>
                  <Button onClick={handleEnd}>
                    리포트 확인하기
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
