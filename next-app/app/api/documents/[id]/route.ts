import { NextResponse } from 'next/server'
import {
  deleteDocumentRecord,
  getDocumentRecord,
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
    return NextResponse.json(document)
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
