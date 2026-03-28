export function extractVariations(rawResponse: string): string[] {
  // Primary: look for our custom markers
  const pattern = /<!--\s*VARIACAO_START\s*-->([\s\S]*?)<!--\s*VARIACAO_END\s*-->/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(rawResponse)) !== null) {
    const html = match[1].trim()
    if (html) matches.push(html)
  }

  if (matches.length > 0) return matches

  // Fallback 1: strip markdown code fences and return whole response
  const stripped = rawResponse
    .replace(/```html\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // Fallback 2: if it looks like HTML, return as single variation
  if (stripped.includes('<!DOCTYPE') || stripped.includes('<html') || stripped.includes('<body')) {
    return [stripped]
  }

  return []
}
