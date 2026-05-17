"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ResumeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface QuestionItem {
  id: string
  question: string
  answer: string
}

export function ResumeModal({ open, onOpenChange }: ResumeModalProps) {
  const [companyName, setCompanyName] = useState("")
  const [position, setPosition] = useState("")
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { id: "1", question: "", answer: "" }
  ])

  const addQuestion = () => {
    const newId = String(Date.now())
    setQuestions([...questions, { id: newId, question: "", answer: "" }])
  }

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id))
    }
  }

  const updateQuestion = (id: string, field: "question" | "answer", value: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleSave = () => {
    // TODO: Save logic
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border/50 bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            새 이력서 추가
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            지원할 기업과 직무 정보, 자기소개서 문항을 입력해주세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-foreground">기업명</Label>
              <Input
                id="company"
                placeholder="예: 네이버"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="border-border/50 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position" className="text-foreground">직무</Label>
              <Input
                id="position"
                placeholder="예: 백엔드 개발자"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="border-border/50 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium text-foreground">자기소개서 문항</Label>
              <span className="text-sm text-muted-foreground">
                {questions.length}개 문항
              </span>
            </div>

            <div className="space-y-4">
              {questions.map((item, index) => (
                <Card key={item.id} className="relative border-border/50 bg-secondary/30 p-4">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 cursor-grab text-muted-foreground/40">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  
                  <div className="space-y-3 pl-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      {questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                          onClick={() => removeQuestion(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        placeholder="질문을 입력하세요 (예: 본인의 강점과 약점은 무엇인가요?)"
                        value={item.question}
                        onChange={(e) => updateQuestion(item.id, "question", e.target.value)}
                        className="border-border/50 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Textarea
                        placeholder="답변을 입력하세요..."
                        value={item.answer}
                        onChange={(e) => updateQuestion(item.id, "answer", e.target.value)}
                        className="min-h-[100px] resize-none border-border/50 bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary"
                      />
                      <div className="text-right text-xs text-muted-foreground">
                        {item.answer.length}자
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Add Question Button */}
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed border-border/50 bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              onClick={addQuestion}
            >
              <Plus className="h-4 w-4" />
              문항 추가
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-4">
          <Button variant="ghost" onClick={handleClose} className="text-muted-foreground hover:bg-secondary hover:text-foreground">
            취소
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!companyName || !position}
            className="bg-gradient-to-r from-primary to-violet-600 text-white hover:opacity-90"
          >
            저장하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
