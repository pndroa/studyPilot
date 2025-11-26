export interface Topic {
  id: string
  title: string
}

export type Sender = 'user' | 'ai'

export interface ChatMessage {
  id: string
  topicId: string
  sender: Sender
  text: string
  timestamp: string
}

export interface QuizQuestion {
  id: string
  topicId: string
  question: string
  options: string[]
  answerIndex: number
}

export interface FlashCardData {
  id: string
  topicId: string
  question: string
  answer: string
}
