/**
 * Geração de imagem via DALL-E 3 (OpenAI).
 * Requer OPENAI_IMAGE_API_KEY no ambiente (ou reutiliza chave OpenAI do provider de texto).
 * Se não configurado ou falhar → retorna null (degrada para arte CSS).
 */

import OpenAI from 'openai'

export type ImageFormat = 'post' | 'story'

export interface ImageContext {
  subject: string          // Assunto do post
  styleHint: string        // Campo imageStyle do form (pode ser vazio)
  companyName: string      // Nome da empresa
  segment: string          // Segmento/nicho da empresa
  emotionalTone: string    // Tom emocional escolhido
  writingStyle: string     // Estilo de escrita escolhido
  format: ImageFormat
}

// Mapeamento de tom emocional → instrução visual para o DALL-E
const toneToVisual: Record<string, string> = {
  urgente:     'senso de urgência, movimento, dinamismo, luz intensa',
  empolgante:  'energia, celebração, otimismo, cores vibrantes',
  confiavel:   'profissionalismo, seriedade, luz limpa, ambiente organizado',
  inspirador:  'aspiracional, luz suave dourada, sensação de conquista',
}

// Mapeamento de estilo de escrita → composição visual
const styleToComposition: Record<string, string> = {
  direto:      'composição limpa, foco no objeto principal, fundo neutro',
  educativo:   'contexto informativo, ambiente de aprendizado ou trabalho',
  provocativo: 'ângulo inusitado, contraste marcante, composição ousada',
  empatico:    'pessoas reais, expressão humana, ambiente acolhedor',
}

export async function generateImage(
  ctx: ImageContext,
  apiKey: string
): Promise<string | null> {
  if (!apiKey) return null

  // DALL-E 3 aceita: 1024x1024, 1792x1024, 1024x1792
  const size: '1024x1024' | '1024x1792' =
    ctx.format === 'story' ? '1024x1792' : '1024x1024'

  const visualTone  = toneToVisual[ctx.emotionalTone]       ?? 'moderno, profissional, clean'
  const composition = styleToComposition[ctx.writingStyle]   ?? 'composição equilibrada'
  const customHint  = ctx.styleHint?.trim()
    ? `Detalhe adicional: ${ctx.styleHint}.`
    : ''

  const prompt = [
    `Imagem de alta qualidade para post de redes sociais.`,
    `Empresa: ${ctx.companyName} — setor: ${ctx.segment || 'geral'}.`,
    `Assunto do post: "${ctx.subject}".`,
    `Tom visual: ${visualTone}.`,
    `Composição: ${composition}.`,
    customHint,
    `SEM texto, SEM letras, SEM palavras na imagem.`,
    `Iluminação profissional, alta resolução, estilo fotográfico ou ilustração premium.`,
  ].filter(Boolean).join(' ')

  try {
    const client = new OpenAI({ apiKey })

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'standard',
      response_format: 'url',
    })

    return response.data[0]?.url ?? null
  } catch {
    return null
  }
}
