import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { readAIConfig, writeAIConfig, maskApiKey } from '@/lib/ai-config'
import type { AIProvider } from '@/types'

const VALID_PROVIDERS: AIProvider[] = ['claude', 'openai', 'gemini']

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

// GET — retorna provider + chave mascarada
export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const config = readAIConfig()
  if (!config) {
    return NextResponse.json({ configured: false })
  }

  return NextResponse.json({
    configured: true,
    provider: config.provider,
    maskedKey: maskApiKey(config.apiKey),
  })
}

// POST — salva nova configuração
export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const { provider, apiKey } = body as Record<string, unknown>

  if (!VALID_PROVIDERS.includes(provider as AIProvider)) {
    return NextResponse.json({ error: 'Provider inválido. Use: claude, openai ou gemini.' }, { status: 400 })
  }

  if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return NextResponse.json({ error: 'Chave de API inválida (mínimo 10 caracteres).' }, { status: 400 })
  }

  writeAIConfig(provider as AIProvider, apiKey.trim())
  return NextResponse.json({ ok: true })
}
