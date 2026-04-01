/**
 * Geração de imagem via DALL-E 3 (OpenAI).
 * Requer OPENAI_IMAGE_API_KEY no ambiente.
 * Se não configurado ou falhar → retorna null (degrada para arte CSS).
 */

import OpenAI from 'openai'

export type ImageFormat = 'post' | 'story'

/**
 * Gera uma imagem real via DALL-E 3 com base no assunto e estilo.
 * @param subject  Assunto principal do post
 * @param style    Descrição visual adicional (campo imageStyle do form)
 * @param format   'post' → quadrado, 'story' → retrato
 */
export async function generateImage(
  subject: string,
  style: string,
  format: ImageFormat
): Promise<string | null> {
  const apiKey = process.env.OPENAI_IMAGE_API_KEY
  if (!apiKey) return null

  // DALL-E 3 aceita: 1024x1024, 1792x1024, 1024x1792
  const size: '1024x1024' | '1024x1792' =
    format === 'story' ? '1024x1792' : '1024x1024'

  // Monta prompt visual objetivo — sem texto no image (DALL-E tende a errar texto)
  const styleHint = style?.trim()
    ? `Estilo visual: ${style}.`
    : 'Estilo moderno, profissional, clean.'

  const prompt =
    `Foto ou arte visual de alta qualidade para um post de redes sociais sobre: "${subject}". ` +
    `${styleHint} ` +
    `SEM texto, SEM letras, SEM palavras na imagem. ` +
    `Iluminação profissional, composição centrada, fundo limpo ou com contexto relevante.`

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
