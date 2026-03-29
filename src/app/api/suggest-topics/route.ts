export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getActiveCompany } from '@/lib/companies'
import { readAIConfig } from '@/lib/ai-config'
import { generateWithAI } from '@/lib/ai'

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-gerador-de-posts-local-32chars-ok')
    await jwtVerify(token, secret)
    return true
  } catch { return false }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const aiConfig = await readAIConfig()
  if (!aiConfig) return NextResponse.json({ error: 'IA não configurada.' }, { status: 500 })

  const company = await getActiveCompany()
  if (!company) return NextResponse.json({ error: 'Nenhuma empresa cadastrada.' }, { status: 400 })

  // Fetch website content
  let websiteContext = ''
  if (company.websiteUrl) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(company.websiteUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } })
      clearTimeout(timeout)
      if (res.ok) {
        const html = await res.text()
        websiteContext = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 2000)
      }
    } catch {}
  }

  const prompt = `Você é um especialista em marketing digital e criação de conteúdo para Instagram.

Empresa: ${company.name}
Descrição: ${company.description || '(não informada)'}
Website: ${company.websiteUrl || '(não informado)'}
${websiteContext ? `\nConteúdo do site:\n${websiteContext}` : ''}

Sugira 8 temas de posts para Instagram para esta empresa. Cada tema deve:
- Ser específico, relevante e atual para o nicho da empresa
- Abordar dores reais do público-alvo ou benefícios concretos
- Ter potencial de engajamento alto
- Ser diferente dos demais (variar o ângulo de abordagem)

Retorne APENAS um JSON com este formato (sem markdown, sem explicações):
{"topics": ["tema 1", "tema 2", "tema 3", "tema 4", "tema 5", "tema 6", "tema 7", "tema 8"]}`

  try {
    const raw = await generateWithAI(aiConfig.provider, aiConfig.apiKey, prompt)
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json({ topics: parsed.topics || [] })
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar sugestões.' }, { status: 500 })
  }
}
