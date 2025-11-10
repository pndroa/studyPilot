import { Embeddings } from '@langchain/core/embeddings'
import { createHash } from 'node:crypto'
import { tokenizeText } from '../document/tokenizer'

export class LocalEmbeddings extends Embeddings {
  private readonly dimensions: number

  constructor(dimensions = 256) {
    super({})
    this.dimensions = dimensions
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.embedText(text))
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embedText(text)
  }

  private embedText(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0)
    const tokens = tokenizeText(text)

    tokens.forEach((token) => {
      const hash = createHash('sha256').update(token).digest()
      const bucket = hash.readUInt32BE(0) % this.dimensions
      vector[bucket] += 1
    })

    return vector
  }
}
