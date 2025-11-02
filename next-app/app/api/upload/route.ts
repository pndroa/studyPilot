// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const MAX_FILE_SIZE = 15 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'text/plain']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ message: 'Keine Datei erhalten.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Dateityp nicht erlaubt.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Datei ist zu groß.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const fileName = `${Date.now()}-${safeName}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    return NextResponse.json(
      {
        message: 'Upload erfolgreich',
        fileName,
        path: filePath,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { message: 'Interner Fehler beim Upload.' },
      { status: 500 }
    )
  }
}
