import { NextResponse } from 'next/server'
import {
  deleteDocumentRecord,
  getDocumentRecord,
  saveDocumentRecord,
} from '@/lib/document/documentRepository'
import { LangChainRedisHarness } from '@/lib/langchain/redisHarness'

const redisHarness = new LangChainRedisHarness()

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const document = await getDocumentRecord(id)
    if (!document) {
      return NextResponse.json(
        { message: 'Dokument nicht gefunden.' },
        { status: 404 }
      )
    }

    const chunkTexts = Array.isArray(document.chunks)
      ? document.chunks.map((chunk) => chunk.text)
      : []

    const indexSummary = await redisHarness.ensureDocumentIndexed(
      document.documentId,
      chunkTexts
    )
    const neighbors = await redisHarness.similaritySearch(
      document.documentId,
      chunkTexts[0] ?? 'Dokument'
    )

    const enriched = {
      ...document,
      embeddingsSummary: indexSummary,
      redisInfo: {
        indexKey: redisHarness.getIndexKey(document.documentId),
        nearestNeighbors: neighbors,
      },
    }

    try {
      await saveDocumentRecord(enriched)
    } catch (persistError) {
      console.warn('Dokument konnte nicht aktualisiert werden', persistError)
    }

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Dokument abrufen fehlgeschlagen', error)
    return NextResponse.json(
      { message: 'Dokument konnte nicht geladen werden.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await deleteDocumentRecord(id)
    await redisHarness.resetDocument(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dokument löschen fehlgeschlagen', error)
    return NextResponse.json(
      { message: 'Dokument konnte nicht gelöscht werden.' },
      { status: 500 }
    )
  }
}
