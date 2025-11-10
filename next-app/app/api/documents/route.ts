import { NextResponse } from 'next/server'
import { listDocumentSummaries } from '@/lib/document/documentRepository'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const documents = await listDocumentSummaries()
    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Dokumentenliste fehlgeschlagen', error)
    return NextResponse.json(
      { message: 'Dokumentenliste konnte nicht geladen werden.' },
      { status: 500 }
    )
  }
}
