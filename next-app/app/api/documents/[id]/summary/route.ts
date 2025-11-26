import { NextResponse } from 'next/server'
import { generateSummary } from '@/lib/llm/service'
import { normalizeProvider } from '@/lib/llm/providerClient'
import { getDocumentRecord, saveDocumentRecord } from '@/lib/document/documentRepository'

export const runtime = 'nodejs'

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const provider = normalizeProvider(body.provider)
    const text =
      typeof body.text === 'string' && body.text.trim()
        ? body.text.trim()
        : undefined
    const model =
      typeof body.model === 'string' && body.model.trim()
        ? body.model.trim()
        : undefined
    const apiKey =
      typeof body.apiKey === 'string' && body.apiKey.trim()
        ? body.apiKey.trim()
        : undefined
    const baseUrl =
      typeof body.baseUrl === 'string' && body.baseUrl.trim()
        ? body.baseUrl.trim()
        : undefined

    const document = await getDocumentRecord(id)
    if (!document) {
      return NextResponse.json(
        { message: 'Dokument nicht gefunden.' },
        { status: 404 }
      )
    }

    const targetText = text ?? document.textPreview?.trim()
    if (!targetText) {
      return NextResponse.json(
        { message: 'Kein Text fuer die Zusammenfassung vorhanden.' },
        { status: 400 }
      )
    }

    const result = await generateSummary({
      provider,
      text: targetText,
      topic: document.fileName || 'Dokument',
      model,
      baseUrl,
      apiKey,
    })

    const summary = {
      summary: result.summary,
      provider: result.provider,
      model: result.model,
      usedEndpoint: result.usedEndpoint,
      generatedAt: new Date().toISOString(),
    }

    await saveDocumentRecord({ ...document, summary })

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Dokument Zusammenfassung fehlgeschlagen', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Die Zusammenfassung ist fehlgeschlagen.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
