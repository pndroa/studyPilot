import type { Topic, ChatMessage, QuizQuestion } from '@/types/topics'
import type { DashboardStats, QuizDataPoint } from '@/types/dashboard'

// --- Dashboard-Stats (unverändert) ---
export const mockStats: DashboardStats = {
  totalSessions: 42,
  avgScore: 85,
  streak: 7,
  studyDays: [
    { day: 'Mo', sessions: 2 },
    { day: 'Di', sessions: 3 },
    { day: 'Mi', sessions: 1 },
    { day: 'Do', sessions: 4 },
    { day: 'Fr', sessions: 2 },
    { day: 'Sa', sessions: 0 },
    { day: 'So', sessions: 1 },
  ],
}

export const mockQuizTrend: QuizDataPoint[] = [
  { date: '01.11', score: 70 },
  { date: '02.11', score: 85 },
  { date: '03.11', score: 90 },
  { date: '04.11', score: 80 },
  { date: '05.11', score: 95 },
]

// --- Themen ---
export const mockTopics: Topic[] = [
  { id: 'vorlesung-1', title: 'Vorlesung 1: Einführung in KI' },
  { id: 'vorlesung-2', title: 'Vorlesung 2: Maschinelles Lernen' },
]

// --- Chat-Verläufe je Thema ---
export const mockChatByTopic: Record<string, ChatMessage[]> = {
  'vorlesung-1': [
    {
      id: 'c1',
      topicId: 'vorlesung-1',
      sender: 'ai',
      text: 'Kurze Zusammenfassung: Künstliche Intelligenz (KI) umfasst Methoden, um Maschinen Aufgaben zu ermöglichen, die menschliche Intelligenz erfordern (z. B. Mustererkennung, Planung, Sprache).',
      timestamp: '2025-10-30T09:00:00.000Z',
    },
    {
      id: 'c2',
      topicId: 'vorlesung-1',
      sender: 'user',
      text: 'Erkläre den Unterschied zwischen starker und schwacher KI.',
      timestamp: '2025-10-30T09:02:10.000Z',
    },
    {
      id: 'c3',
      topicId: 'vorlesung-1',
      sender: 'ai',
      text: 'Schwache (narrow) KI löst spezialisierte Aufgaben (z. B. Bildklassifikation). Starke KI hätte allgemeine kognitive Fähigkeiten wie ein Mensch — existiert aktuell nicht.',
      timestamp: '2025-10-30T09:02:20.000Z',
    },
  ],
  'vorlesung-2': [
    {
      id: 'c4',
      topicId: 'vorlesung-2',
      sender: 'ai',
      text: 'Zusammenfassung ML: Lernen aus Daten, um Vorhersagen/Entscheidungen zu treffen. Kategorien: überwacht, unüberwacht, bestärkendes Lernen.',
      timestamp: '2025-10-31T14:21:00.000Z',
    },
  ],
}

// --- Quizfragen je Thema ---
export const mockQuizzesByTopic: Record<string, QuizQuestion[]> = {
  'vorlesung-1': [
    {
      id: 'q1-v1',
      topicId: 'vorlesung-1',
      question: 'Was beschreibt schwache (narrow) KI am besten?',
      options: [
        'KI mit vollen menschlichen kognitiven Fähigkeiten',
        'Spezialisierte Systeme für eng umrissene Aufgaben',
        'Rein symbolische Systeme ohne Daten',
        'Quantencomputer-basierte KI',
      ],
      answerIndex: 1,
    },
    {
      id: 'q2-v1',
      topicId: 'vorlesung-1',
      question: 'Welche Aufgabe ist KEIN klassisches KI-Beispiel?',
      options: [
        'Bildklassifikation',
        'Maschinelles Übersetzen',
        'Webserver-Hosting',
        'Spracherkennung',
      ],
      answerIndex: 2,
    },
  ],
  'vorlesung-2': [
    {
      id: 'q1-v2',
      topicId: 'vorlesung-2',
      question: 'Welche Aussage zu überwachten Lernverfahren ist korrekt?',
      options: [
        'Es gibt keine Labels im Training.',
        'Das Ziel ist, versteckte Strukturen in Daten zu finden.',
        'Modelle lernen eine Abbildung von Eingaben auf bekannte Zielwerte.',
        'Das Verfahren ist identisch mit bestärkendem Lernen.',
      ],
      answerIndex: 2,
    },
    {
      id: 'q2-v2',
      topicId: 'vorlesung-2',
      question: 'Welches ist ein Beispiel für unüberwachtes Lernen?',
      options: [
        'Lineare Regression',
        'K-Means-Clustering',
        'Logistische Regression',
        'Random Forest Klassifikation',
      ],
      answerIndex: 1,
    },
  ],
}
