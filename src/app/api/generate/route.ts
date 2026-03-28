export const maxDuration = 60 // segundos — necessário para IA gerar múltiplas variações

import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt } from '@/lib/prompt-builder'
import { generateWithAI } from '@/lib/ai'
import { extractVariations } from '@/lib/html-parser'
import { validateGenerateRequest } from '@/lib/validation'
import type { GenerateRequest, GenerateResponse } from '@/types'

// ─── Rate limiting em memória (10 req/min por IP) ──────────────────────────
// Nota: reseta em cold starts do Vercel — use Redis/KV para produção com alto tráfego
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ─── Handler ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: 'Muitas requisições. Aguarde um minuto e tente novamente.' },
      { status: 429 }
    )
  }

  // Body size limit (3MB)
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > 3 * 1024 * 1024) {
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: 'Payload muito grande.' },
      { status: 413 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: 'JSON inválido.' },
      { status: 400 }
    )
  }

  // Validate all inputs at the boundary — runtime check (TypeScript is stripped at runtime)
  const validation = validateGenerateRequest(body)
  if (!validation.valid) {
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: validation.error ?? 'Dados inválidos.' },
      { status: 400 }
    )
  }

  const { settings, formData } = body as GenerateRequest

  try {
    const prompt = buildPrompt(settings, formData)
    const rawResponse = await generateWithAI(
      settings.ai.provider,
      settings.ai.apiKey,
      prompt
    )

    const variations = extractVariations(rawResponse)

    if (variations.length === 0) {
      return NextResponse.json<GenerateResponse>(
        {
          variations: [],
          error: 'A IA não retornou HTML válido. Tente reformular o assunto ou reduza o número de variações.',
        },
        { status: 422 }
      )
    }

    return NextResponse.json<GenerateResponse>({ variations })
  } catch (err: unknown) {
    // Log internamente com detalhes, mas retorna mensagem genérica ao cliente
    const internalMessage = err instanceof Error ? err.message : String(err)
    console.error(`[/api/generate] ip=${ip} error=${internalMessage}`)

    // Detectar erros comuns dos SDKs de IA para dar mensagem útil sem expor internos
    let clientMessage = 'Erro ao gerar posts. Tente novamente.'
    if (internalMessage.includes('401') || internalMessage.toLowerCase().includes('api key') || internalMessage.toLowerCase().includes('authentication')) {
      clientMessage = 'Chave de API inválida ou sem permissão.'
    } else if (internalMessage.includes('429') || internalMessage.toLowerCase().includes('rate limit') || internalMessage.toLowerCase().includes('quota')) {
      clientMessage = 'Limite de requisições da IA atingido. Aguarde e tente novamente.'
    } else if (internalMessage.includes('timeout') || internalMessage.includes('ETIMEDOUT')) {
      clientMessage = 'A IA demorou muito para responder. Reduza o número de variações e tente novamente.'
    }

    return NextResponse.json<GenerateResponse>(
      { variations: [], error: clientMessage },
      { status: 500 }
    )
  }
}
