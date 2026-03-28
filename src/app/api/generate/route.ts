import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt } from '@/lib/prompt-builder'
import { generateWithAI } from '@/lib/ai'
import { extractVariations } from '@/lib/html-parser'
import type { GenerateRequest, GenerateResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { settings, formData } = body

    if (!settings?.ai?.apiKey) {
      return NextResponse.json<GenerateResponse>(
        { variations: [], error: 'Chave de API não configurada. Acesse Configurações.' },
        { status: 400 }
      )
    }

    if (!formData?.subject?.trim()) {
      return NextResponse.json<GenerateResponse>(
        { variations: [], error: 'O campo Assunto é obrigatório.' },
        { status: 400 }
      )
    }

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
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[/api/generate]', message)
    return NextResponse.json<GenerateResponse>(
      { variations: [], error: message },
      { status: 500 }
    )
  }
}
