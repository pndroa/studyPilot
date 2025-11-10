import pdfParse from 'pdf-parse/lib/pdf-parse'

export interface DocumentParseResult {
  text: string
  meta: {
    numPages?: number
    fileSize: number
    detectedMimeType: string
  }
}

export async function parseDocument(
  buffer: Buffer,
  mimeType: string
): Promise<DocumentParseResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Leere Datei erhalten.')
  }

  if (mimeType === 'application/pdf') {
    return parsePdf(buffer)
  }

  if (mimeType === 'text/plain') {
    return parsePlainText(buffer)
  }

  throw new Error(`Nicht unterstützter Dateityp: ${mimeType}`)
}

async function parsePdf(buffer: Buffer): Promise<DocumentParseResult> {
  const result = await pdfParse(buffer)
  return {
    text: result.text.trim(),
    meta: {
      numPages: result.numpages,
      fileSize: buffer.length,
      detectedMimeType: 'application/pdf',
    },
  }
}

function parsePlainText(buffer: Buffer): DocumentParseResult {
  const text = buffer.toString('utf-8').trim()
  return {
    text,
    meta: {
      fileSize: buffer.length,
      detectedMimeType: 'text/plain',
    },
  }
}
