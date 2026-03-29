import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { readSystemRules, writeSystemRules } from '@/lib/system-settings'

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-gerador-de-posts-local-32chars-ok')
    await jwtVerify(token, secret)
    return true
  } catch { return false }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json({ aiRules: await readSystemRules() })
}

export async function POST(req: NextRequest) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  if (typeof body.aiRules !== 'string' || body.aiRules.length < 50) {
    return NextResponse.json({ error: 'Regras inválidas.' }, { status: 400 })
  }
  await writeSystemRules(body.aiRules)
  return NextResponse.json({ ok: true })
}
