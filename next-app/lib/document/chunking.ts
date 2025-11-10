import { tokenizeText } from './tokenizer'

export interface ChunkingOptions {
  chunkSize?: number
  overlap?: number
}

export interface TextChunk {
  id: string
  text: string
  tokenCount: number
  startToken: number
  endToken: number
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  chunkSize: 200,
  overlap: 40,
}

export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  return chunkTokens(tokenizeText(text), options)
}

export function chunkTokens(
  tokens: string[],
  options: ChunkingOptions = {}
): TextChunk[] {
  const { chunkSize, overlap } = { ...DEFAULT_OPTIONS, ...options }

  if (tokens.length === 0) {
    return []
  }

  const chunks: TextChunk[] = []
  let start = 0
  let chunkIndex = 0

  while (start < tokens.length) {
    const end = Math.min(start + chunkSize, tokens.length)
    const chunkTokens = tokens.slice(start, end)
    chunks.push({
      id: `chunk-${chunkIndex}`,
      text: chunkTokens.join(' '),
      tokenCount: chunkTokens.length,
      startToken: start,
      endToken: end,
    })

    if (end === tokens.length) {
      break
    }

    start = end - overlap
    chunkIndex += 1
  }

  return chunks
}
