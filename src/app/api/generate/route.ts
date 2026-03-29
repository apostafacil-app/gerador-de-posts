export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt, getLogoForTheme, injectLogo } from '@/lib/prompt-builder'
import { generateWithAI } from '@/lib/ai'
import { extractVariations, extractCaptions } from '@/lib/html-parser'
import { validateGenerateRequest } from '@/lib/validation'
import { readAIConfig } from '@/lib/ai-config'
import { getActiveCompany } from '@/lib/companies'
import type { GenerateRequest, GenerateResponse } from '@/types'

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

  // Chave de API e provider lidos do servidor (arquivo ou env vars)
  const aiConfig = readAIConfig()

  if (!aiConfig) {
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: 'IA não configurada. Acesse Configurações → IA para configurar.' },
      { status: 500 }
    )
  }

  const { provider, apiKey } = aiConfig

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

  const { formData } = body as GenerateRequest

  // Company always read from server — never trust client
  const company = getActiveCompany()
  if (!company) {
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: 'Nenhuma empresa configurada. Acesse Configurações para adicionar uma empresa.' },
      { status: 400 }
    )
  }

  // Busca conteúdo do site da empresa para enriquecer o contexto do prompt
  let websiteContext: string | undefined
  if (company.websiteUrl) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)
      const siteRes = await fetch(company.websiteUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GeradorPosts/1.0)' },
      })
      clearTimeout(timeout)
      if (siteRes.ok) {
        const html = await siteRes.text()
        // Extrai apenas texto, remove tags HTML e whitespace excessivo
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 2500)
        if (text.length > 100) websiteContext = text
      }
    } catch {
      // Falha silenciosa — gera sem contexto do site
    }
  }

  try {
    const prompt = buildPrompt(company, formData, websiteContext)
    const rawResponse = await generateWithAI(provider, apiKey, prompt)
    const rawVariations = extractVariations(rawResponse)

    if (rawVariations.length === 0) {
      return NextResponse.json<GenerateResponse>(
        { variations: [], error: 'A IA não retornou HTML válido. Tente reformular o assunto.' },
        { status: 422 }
      )
    }

    // Injeta o base64 da logo no HTML (era um placeholder no prompt para evitar tokens excessivos)
    const logoBase64 = getLogoForTheme(company, formData.theme)
    const variations = logoBase64
      ? rawVariations.map(html => injectLogo(html, logoBase64))
      : rawVariations

    const captions = formData.generateCaption ? extractCaptions(rawResponse) : undefined

    return NextResponse.json<GenerateResponse>({ variations, captions })
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
