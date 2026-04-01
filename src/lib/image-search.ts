/**
 * Pexels image search — busca foto real pelo assunto do post.
 * Requer PEXELS_API_KEY no ambiente.
 * Se a chave não estiver configurada ou a busca falhar, retorna null
 * e o sistema degrada para arte CSS (comportamento padrão).
 */

const PEXELS_API = 'https://api.pexels.com/v1/search'

export type ImageOrientation = 'square' | 'portrait' | 'landscape'

export interface PexelsPhoto {
  url: string        // URL da foto (large2x ~1280px)
  thumb: string      // URL miniatura (para debug)
  photographer: string
  alt: string
}

/**
 * Busca uma foto relevante no Pexels.
 * @param query  Palavras-chave (assunto do post + imageStyle)
 * @param orientation 'portrait' para stories, 'square' para posts
 */
export async function searchPhoto(
  query: string,
  orientation: ImageOrientation = 'square'
): Promise<PexelsPhoto | null> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return null

  try {
    const params = new URLSearchParams({
      query,
      per_page: '5',
      orientation,
      size: 'large',
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${PEXELS_API}?${params}`, {
      headers: { Authorization: apiKey },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json() as {
      photos: Array<{
        src: { large2x: string; medium: string }
        photographer: string
        alt: string
      }>
    }

    const photo = data.photos?.[0]
    if (!photo) return null

    return {
      url: photo.src.large2x,
      thumb: photo.src.medium,
      photographer: photo.photographer,
      alt: photo.alt ?? query,
    }
  } catch {
    return null
  }
}
