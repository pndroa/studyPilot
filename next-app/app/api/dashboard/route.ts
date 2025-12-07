import { NextResponse } from 'next/server'
import { loadDashboard } from '@/lib/dashboard/progressRepository'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await loadDashboard()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Dashboard] Laden der Statistiken fehlgeschlagen', error)
    return NextResponse.json(
      { message: 'Dashboard-Daten konnten nicht geladen werden.' },
      { status: 500 }
    )
  }
}
