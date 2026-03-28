import type { GenerateRequest, PostFormat, PostTheme, WritingStyle, EmotionalTone, PersuasionTechnique } from '@/types'

// ─── Limits ────────────────────────────────────────────────────────────────
const LIMITS = {
  COMPANY_NAME: 150,
  COMPANY_DESC: 1000,
  WEBSITE_URL: 300,
  SUBJECT: 1000,
  IMAGE_STYLE: 300,
  AI_RULES: 25000,
  LOGO_BASE64: 1_200_000, // ~900KB de imagem
  COLOR_HEX: 7,
}

// ─── Valid enum values ──────────────────────────────────────────────────────
const VALID_FORMATS: PostFormat[] = ['post', 'story']
const VALID_THEMES: PostTheme[] = ['dark', 'white']
const VALID_WRITING_STYLES: WritingStyle[] = ['direto', 'educativo', 'provocativo', 'empatico']
const VALID_EMOTIONAL_TONES: EmotionalTone[] = ['urgente', 'empolgante', 'exclusivo', 'confiavel']
const VALID_PERSUASION: PersuasionTechnique[] = ['beneficio_direto', 'escassez', 'curiosidade', 'prova_social']

// ─── Helpers ────────────────────────────────────────────────────────────────
function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function maxLen(v: string, max: number): boolean {
  return v.length <= max
}

function isHex(v: string): boolean {
  return /^#[0-9a-fA-F]{3,6}$/.test(v)
}

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v)
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidBase64Image(v: string): boolean {
  return /^data:image\/(png|jpeg|jpg|svg\+xml|webp);base64,[A-Za-z0-9+/=]+$/.test(v)
}

// ─── Main validator ─────────────────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateGenerateRequest(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Corpo da requisição inválido.' }
  }

  const req = body as Record<string, unknown>
  const settings = req.settings as Record<string, unknown> | undefined
  const formData = req.formData as Record<string, unknown> | undefined

  if (!settings || typeof settings !== 'object') {
    return { valid: false, error: 'Configurações ausentes.' }
  }
  if (!formData || typeof formData !== 'object') {
    return { valid: false, error: 'Dados do formulário ausentes.' }
  }

  // ── Settings: Company ──
  const company = settings.company as Record<string, unknown> | undefined
  if (!company || typeof company !== 'object') {
    return { valid: false, error: 'Dados da empresa ausentes.' }
  }

  if (!isString(company.name) || !maxLen(company.name, LIMITS.COMPANY_NAME)) {
    return { valid: false, error: `Nome da empresa: máximo ${LIMITS.COMPANY_NAME} caracteres.` }
  }
  if (!isString(company.description) || !maxLen(company.description, LIMITS.COMPANY_DESC)) {
    return { valid: false, error: `Descrição: máximo ${LIMITS.COMPANY_DESC} caracteres.` }
  }
  if (
    !isString(company.websiteUrl) ||
    !maxLen(company.websiteUrl, LIMITS.WEBSITE_URL) ||
    (company.websiteUrl !== '' && !isValidUrl(company.websiteUrl))
  ) {
    return { valid: false, error: 'URL do site inválida. Use https://.' }
  }

  // ── Settings: Colors ──
  const colors = settings.colors as Record<string, unknown> | undefined
  if (!colors || typeof colors !== 'object') {
    return { valid: false, error: 'Cores ausentes.' }
  }
  for (const key of ['primary', 'secondary', 'accent']) {
    const val = colors[key]
    if (!isString(val) || !isHex(val)) {
      return { valid: false, error: `Cor "${key}" inválida.` }
    }
  }

  // ── Settings: Logos ──
  const logos = settings.logos as Record<string, unknown> | undefined
  if (!logos || typeof logos !== 'object') {
    return { valid: false, error: 'Logos ausentes.' }
  }
  for (const key of ['darkBackground', 'whiteBackground']) {
    const val = logos[key]
    if (!isString(val)) {
      return { valid: false, error: `Logo "${key}" inválida.` }
    }
    if (val !== '' && !isValidBase64Image(val)) {
      return { valid: false, error: `Logo "${key}" deve ser uma imagem base64 válida.` }
    }
    if (!maxLen(val, LIMITS.LOGO_BASE64)) {
      return { valid: false, error: `Logo "${key}" excede o tamanho permitido.` }
    }
  }

  // ── Settings: AI Rules ──
  if (!isString(settings.aiRules) || !maxLen(settings.aiRules as string, LIMITS.AI_RULES)) {
    return { valid: false, error: `Regras de IA: máximo ${LIMITS.AI_RULES} caracteres.` }
  }

  // ── FormData ──
  const fd = formData as Record<string, unknown>

  if (!isString(fd.format) || !(VALID_FORMATS as string[]).includes(fd.format)) {
    return { valid: false, error: 'Formato inválido.' }
  }
  if (!isString(fd.theme) || !(VALID_THEMES as string[]).includes(fd.theme)) {
    return { valid: false, error: 'Tema inválido.' }
  }
  if (!isString(fd.subject) || fd.subject.trim().length < 5) {
    return { valid: false, error: 'O assunto deve ter pelo menos 5 caracteres.' }
  }
  if (!maxLen(fd.subject, LIMITS.SUBJECT)) {
    return { valid: false, error: `Assunto: máximo ${LIMITS.SUBJECT} caracteres.` }
  }
  if (!isString(fd.writingStyle) || !(VALID_WRITING_STYLES as string[]).includes(fd.writingStyle)) {
    return { valid: false, error: 'Estilo de escrita inválido.' }
  }
  if (!isString(fd.emotionalTone) || !(VALID_EMOTIONAL_TONES as string[]).includes(fd.emotionalTone)) {
    return { valid: false, error: 'Tom emocional inválido.' }
  }
  if (!isString(fd.persuasionTechnique) || !(VALID_PERSUASION as string[]).includes(fd.persuasionTechnique)) {
    return { valid: false, error: 'Técnica de persuasão inválida.' }
  }

  const variations = fd.variations
  if (typeof variations !== 'number' || !Number.isInteger(variations) || variations < 1 || variations > 4) {
    return { valid: false, error: 'Número de variações deve ser entre 1 e 4.' }
  }

  if (typeof fd.useImage !== 'boolean') {
    return { valid: false, error: 'Campo "useImage" inválido.' }
  }
  if (
    !isString(fd.imageStyle) ||
    !maxLen(fd.imageStyle, LIMITS.IMAGE_STYLE)
  ) {
    return { valid: false, error: `Estilo de imagem: máximo ${LIMITS.IMAGE_STYLE} caracteres.` }
  }

  return { valid: true }
}
