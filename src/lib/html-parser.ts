/**
 * Remove qualquer botão de exportação/download que a IA tenha gerado dentro do HTML.
 * Nosso app já tem o botão "Exportar PNG" próprio — o da IA nunca deve aparecer.
 */
function removeExportButtons(html: string): string {
  // Remove tags <button> ou <a> que contenham texto de download/export
  // Também remove elementos com classes/ids sugestivos
  return html
    // Remove <button>...</button> com texto de download
    .replace(/<button[^>]*>[\s\S]*?(?:baixar|download|export|png|salvar)[\s\S]*?<\/button>/gi, '')
    // Remove <a>...</a> com texto de download
    .replace(/<a[^>]*>[\s\S]*?(?:baixar|download|export|png|salvar)[\s\S]*?<\/a>/gi, '')
    // Remove elementos com class/id contendo "toolbar", "export", "download", "btn-export"
    .replace(/<(?:div|section|footer)[^>]*(?:class|id)="[^"]*(?:toolbar|export|download)[^"]*"[^>]*>[\s\S]*?<\/(?:div|section|footer)>/gi, '')
}

export function extractVariations(rawResponse: string): string[] {
  // Primary: look for our custom markers
  const pattern = /<!--\s*VARIACAO_START\s*-->([\s\S]*?)<!--\s*VARIACAO_END\s*-->/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(rawResponse)) !== null) {
    const html = removeExportButtons(match[1].trim())
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
    return [removeExportButtons(stripped)]
  }

  return []
}
