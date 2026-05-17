// TypeScript types for report page

export type InterviewType = 'tech' | 'human'

export interface Resume {
  id: string
  filename: string
}

export interface UpcomingInterview {
  id: string
  company: string
  role: string
  type: InterviewType
  date: string
  dday: number
  resumeId: string
  resumeFilename: string
  previousReports: {
    type: InterviewType
    date: string
    score: number
  }[]
  aiFeedback: string
}

export interface Report {
  id: string
  company: string
  role: string
  type: InterviewType
  date: string
  dayOfWeek: string
  duration: number
  totalScore: number
  resumeId: string
  feedbackPreview: string
  scores: {
    label: string
    value: number
  }[]
}
