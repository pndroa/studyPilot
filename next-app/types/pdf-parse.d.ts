declare module 'pdf-parse' {
  import { Buffer } from 'node:buffer'

  export interface PDFParseResult {
    numpages: number
    numrender: number
    info: Record<string, unknown>
    metadata: unknown
    version: string
    text: string
  }

  export interface PDFParseOptions {
    max?: number
  }

  function pdfParse(
    data: Buffer | Uint8Array,
    options?: PDFParseOptions
  ): Promise<PDFParseResult>

  export default pdfParse
}

declare module 'pdf-parse/lib/pdf-parse' {
  import { Buffer } from 'node:buffer'
  import { PDFParseResult, PDFParseOptions } from 'pdf-parse'

  function pdfParse(
    data: Buffer | Uint8Array,
    options?: PDFParseOptions
  ): Promise<PDFParseResult>

  export default pdfParse
}
