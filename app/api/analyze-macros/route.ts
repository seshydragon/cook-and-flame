import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ error: 'AI analysis not enabled' }, { status: 503 })
}
