export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt } from '@/lib/prompt-builder'
import { generateWithAI } from '@/lib/ai'
import { extractVariations } from '@/lib/html-parser'
import { validateGenerateRequest } from '@/lib/validation'
import type { AIProvider, GenerateRequest, GenerateResponse } from '@/types'

// Rate limiting: 10 req/min por IP
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

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: 'Muitas requisições. Aguarde um minuto.' },
      { status: 429 }
    )
  }

  // Body size: 3MB máximo
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > 3 * 1024 * 1024) {
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: 'Payload muito grande.' },
      { status: 413 }
    )
  }

  // Chave de API e provider vêm do servidor — nunca do cliente
  const provider = process.env.AI_PROVIDER as AIProvider | undefined
  const apiKey = process.env.AI_API_KEY

  if (!provider || !apiKey) {
    console.error('[/api/generate] AI_PROVIDER ou AI_API_KEY não configurados.')
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: 'IA não configurada no servidor. Configure AI_PROVIDER e AI_API_KEY.' },
      { status: 500 }
    )
  }

  const validProviders: AIProvider[] = ['claude', 'openai', 'gemini']
  if (!validProviders.includes(provider)) {
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: 'AI_PROVIDER inválido. Use: claude, openai ou gemini.' },
      { status: 500 }
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
    const rawResponse = await generateWithAI(provider, apiKey, prompt)
    const variations = extractVariations(rawResponse)

    if (variations.length === 0) {
      return NextResponse.json<GenerateResponse>(
        { variations: [], error: 'A IA não retornou HTML válido. Tente reformular o assunto.' },
        { status: 422 }
      )
    }

    return NextResponse.json<GenerateResponse>({ variations })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[/api/generate] ip=${ip} error=${msg}`)

    let clientMessage = 'Erro ao gerar posts. Tente novamente.'
    if (msg.includes('401') || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('authentication')) {
      clientMessage = 'Chave de API inválida. Verifique AI_API_KEY nas variáveis de ambiente.'
    } else if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
      clientMessage = 'Limite de requisições da IA atingido. Aguarde e tente novamente.'
    } else if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
      clientMessage = 'A IA demorou muito para responder. Reduza o número de variações.'
    }

    return NextResponse.json<GenerateResponse>(
      { variations: [], error: clientMessage },
      { status: 500 }
    )
  }
}
