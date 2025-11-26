import { LangChainRedisHarness } from '@/lib/langchain/redisHarness'
import { normalizeProvider, runProviderPrompt } from '@/lib/llm/providerClient'
import type {
  LlmChatRequest,
  LlmChatResponse,
  LlmFlashcardItem,
  LlmFlashcardRequest,
  LlmFlashcardResponse,
  LlmQuizQuestion,
  LlmQuizRequest,
  LlmQuizResponse,
  LlmSummaryRequest,
  LlmSummaryResponse,
} from '@/types/llm'

const MAX_QUESTIONS = 8
const MIN_QUESTIONS = 2
const MIN_CARDS = 3
const MAX_CARDS = 12
const DEFAULT_SIMILARITY_LIMIT = 4

export async function generateSummary(
  input: LlmSummaryRequest
): Promise<LlmSummaryResponse> {
  const provider = normalizeProvider(input.provider)
  const topic = input.topic?.trim() || 'Lerninhalt'
  const text = input.text.trim()

  const prompt = [
    `Fasse den folgenden Text zum Thema "${topic}" auf Deutsch zusammen.`,
    'Liefere 5-7 saubere, klar strukturierte Saetze. Keine Ausschmueckungen, keine Vorworte.',
    '',
    text,
  ].join('\n')

  const result = await runProviderPrompt({
    provider,
    prompt,
    model: input.model,
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
  })

  return {
    summary: result.content,
    provider,
    model: result.model,
    usedEndpoint: result.endpoint,
  }
}

export async function generateQuiz(
  input: LlmQuizRequest
): Promise<LlmQuizResponse> {
  const provider = normalizeProvider(input.provider)
  const topic = input.topic.trim()
  const context = input.text?.trim()
  const targetQuestions = clampQuestionCount(input.questionCount)

  const prompt = [
    `Erstelle ${targetQuestions} Quizfragen (Multiple Choice) zum Thema "${topic}".`,
    'Antwort-Format zwingend als JSON-Array mit dem Schema:',
    `[{"question":"Frage","options":["A","B","C","D"],"answerIndex":0,"explanation":"kurze Begruendung"}]`,
    'Gib nur das JSON-Array zurueck, keine Erklaerungstexte davor oder danach.',
    context ? `Kontext:\n${context}\n` : undefined,
  ]
    .filter(Boolean)
    .join('\n')

  const result = await runProviderPrompt({
    provider,
    prompt,
    model: input.model,
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
  })

  return {
    questions: parseQuizResponse(result.content, targetQuestions),
    provider,
    model: result.model,
    usedEndpoint: result.endpoint,
  }
}

export async function chatWithLlm(
  input: LlmChatRequest
): Promise<LlmChatResponse> {
  const provider = normalizeProvider(input.provider)
  const message = input.message.trim()
  const context = input.context?.trim()
  const redisContext = input.documentId
    ? await fetchRedisContext(input.documentId, message)
    : undefined

  const prompt = [
    'Antworte auf Deutsch, pragnant und faktenbasiert.',
    redisContext
      ? `Nutze folgenden Kontext aus der Vektorsuche (relevanteste Chunks zuerst):\n${redisContext}\n`
      : context
        ? `Nutze diesen Kontext aus dem hochgeladenen Dokument, falls relevant:\n${context}\n`
        : undefined,
    message,
  ]
    .filter(Boolean)
    .join('\n\n')

  const result = await runProviderPrompt({
    provider,
    prompt,
    model: input.model,
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
  })

  return {
    reply: result.content,
    provider,
    model: result.model,
    usedEndpoint: result.endpoint,
  }
}

export async function generateFlashcards(
  input: LlmFlashcardRequest
): Promise<LlmFlashcardResponse> {
  const provider = normalizeProvider(input.provider)
  const topic = input.topic?.trim() || 'Lerninhalt'
  const text = input.text.trim()
  const cardCount = clampCardCount(input.cardCount)

  const prompt = [
    `Erzeuge ${cardCount} Lernkarten (Frage/Aufloesung) zum Thema "${topic}".`,
    'Format: JSON-Array wie [{"question":"...","answer":"..."}].',
    'Keine weiteren Texte vor oder nach dem Array.',
    `Kontext:\n${text}`,
  ].join('\n')

  const result = await runProviderPrompt({
    provider,
    prompt,
    model: input.model,
    baseUrl: input.baseUrl,
    apiKey: input.apiKey,
  })

  return {
    cards: parseFlashcards(result.content, cardCount),
    provider,
    model: result.model,
    usedEndpoint: result.endpoint,
  }
}

function parseQuizResponse(
  raw: string,
  questionCount: number
): LlmQuizQuestion[] {
  const candidate = extractJsonArray(raw)
  let parsed: unknown

  try {
    parsed = JSON.parse(candidate)
  } catch (error) {
    throw new Error('Quiz-Antwort konnte nicht als JSON geparsed werden.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Quiz-Antwort hat kein Fragen-Array geliefert.')
  }

  const normalized = parsed
    .slice(0, questionCount)
    .map((item, index) => normalizeQuestion(item, index))

  return normalized.length > 0
    ? normalized
    : [
        {
          question: 'Keine Fragen generiert.',
          options: ['Bitte erneut versuchen', 'Eingabe pruefen'],
          answerIndex: 0,
        },
      ]
}

function normalizeQuestion(
  item: unknown,
  index: number
): LlmQuizQuestion {
  const source = item as Record<string, unknown>
  const question =
    typeof source.question === 'string' && source.question.trim()
      ? source.question.trim()
      : `Frage ${index + 1}`

  const optionsRaw = Array.isArray(source.options) ? source.options : []
  const options = optionsRaw
    .map((opt) => (typeof opt === 'string' ? opt.trim() : String(opt)))
    .filter(Boolean)
    .slice(0, 6)

  const answerIndex =
    typeof source.answerIndex === 'number' &&
    Number.isInteger(source.answerIndex) &&
    source.answerIndex >= 0 &&
    source.answerIndex < options.length
      ? source.answerIndex
      : 0

  const explanation =
    typeof source.explanation === 'string' && source.explanation.trim()
      ? source.explanation.trim()
      : undefined

  return {
    question,
    options: options.length > 1 ? options : ['Option A', 'Option B'],
    answerIndex: options.length > 1 ? answerIndex : 0,
    explanation,
  }
}

function extractJsonArray(raw: string): string {
  const trimmed = raw.trim()
  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')

  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1)
  }

  return trimmed
}

function clampQuestionCount(value?: number): number {
  if (!Number.isFinite(value ?? NaN)) return 3
  const numeric = Math.trunc(value as number)
  return Math.min(Math.max(numeric, MIN_QUESTIONS), MAX_QUESTIONS)
}

function clampCardCount(value?: number): number {
  if (!Number.isFinite(value ?? NaN)) return 5
  const numeric = Math.trunc(value as number)
  return Math.min(Math.max(numeric, MIN_CARDS), MAX_CARDS)
}

function parseFlashcards(raw: string, count: number): LlmFlashcardItem[] {
  const candidate = extractJsonArray(raw)
  try {
    const parsed = JSON.parse(candidate) as unknown
    if (!Array.isArray(parsed)) throw new Error('Kein Karten-Array.')
    const mapped = parsed.slice(0, count).map((item, index) => {
      const q =
        typeof (item as any)?.question === 'string'
          ? (item as any).question.trim()
          : `Frage ${index + 1}`
      const a =
        typeof (item as any)?.answer === 'string'
          ? (item as any).answer.trim()
          : 'Keine Antwort vorhanden.'
      return { question: q, answer: a }
    })
    return mapped.length > 0
      ? mapped
      : [{ question: 'Keine Karten generiert.', answer: 'Bitte erneut versuchen.' }]
  } catch {
    return [
      {
        question: 'Karten konnten nicht geparsed werden.',
        answer: 'Bitte erneut versuchen.',
      },
    ]
  }
}

async function fetchRedisContext(
  documentId: string,
  query: string,
  limit = DEFAULT_SIMILARITY_LIMIT
): Promise<string | undefined> {
  try {
    const harness = new LangChainRedisHarness()
    const neighbors = await harness.similaritySearch(documentId, query, limit)
    if (!neighbors.length) return undefined
    return neighbors
      .map(
        (item, index) =>
          `#${index + 1} (Score ${item.score.toFixed(3)}): ${item.text}`
      )
      .join('\n\n')
  } catch (error) {
    console.warn('Redis Kontext konnte nicht geladen werden', error)
    return undefined
  }
}
