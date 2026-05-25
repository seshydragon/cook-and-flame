import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ error: 'Payments not enabled yet' }, { status: 503 })
}
