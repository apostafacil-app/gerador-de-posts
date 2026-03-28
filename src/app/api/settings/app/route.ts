import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { readAppSettings, writeAppSettings } from '@/lib/app-settings'
import { validateAppSettings } from '@/lib/validation'
import type { AppSettings } from '@/types'

async function requireAuth(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return false
  try {
    await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    return true
  } catch {
    return false
  }
}

// GET — retorna as configurações salvas
export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  return NextResponse.json(readAppSettings())
}

// POST — salva as configurações
export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const validation = validateAppSettings(body)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  writeAppSettings(body as AppSettings)
  return NextResponse.json({ ok: true })
}
