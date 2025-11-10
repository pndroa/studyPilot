import { NextRequest, NextResponse } from 'next/server'
import { analyzeDocument } from '@/lib/document/analysisService'

const MAX_FILE_SIZE = 15 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'text/plain']

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { message: 'Keine Datei für die Analyse gefunden.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: `Dateityp ${file.type} wird nicht unterstützt. Erlaubt: PDF oder TXT.`,
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'Die Datei überschreitet die erlaubte Größe von 15MB.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const analysis = await analyzeDocument({
      buffer,
      fileName: file.name,
      mimeType: file.type,
    })

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analyse fehlgeschlagen', error)
    return NextResponse.json(
      { message: 'Interner Fehler bei der Dokumentanalyse.' },
      { status: 500 }
    )
  }
}
