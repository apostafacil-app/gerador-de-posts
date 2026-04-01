import { NextRequest, NextResponse } from 'next/server'
import { getImageApiStatus, writeImageApiKey } from '@/lib/image-config'

export async function GET() {
  try {
    const status = await getImageApiStatus()
    return NextResponse.json(status)
  } catch {
    return NextResponse.json({ configured: false, source: null, maskedKey: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const key: string = body.openaiImageKey ?? ''

    if (!key.trim()) {
      return NextResponse.json({ error: 'Chave inválida.' }, { status: 400 })
    }

    if (!key.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Chave inválida. Chaves OpenAI começam com "sk-".' },
        { status: 400 }
      )
    }

    await writeImageApiKey(key.trim())
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 })
  }
}
