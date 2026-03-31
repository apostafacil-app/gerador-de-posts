export type AIProvider = 'claude' | 'openai' | 'gemini'
export type PostFormat = 'post' | 'story'
export type PostTheme = 'dark' | 'white'
export type WritingStyle = 'direto' | 'educativo' | 'provocativo' | 'empatico'
export type EmotionalTone = 'urgente' | 'empolgante' | 'exclusivo' | 'confiavel'
export type PersuasionTechnique = 'beneficio_direto' | 'escassez' | 'curiosidade' | 'prova_social'

export interface Company {
  id: string
  name: string
  description: string
  websiteUrl: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  logos: {
    darkBackground: string    // base64 or empty
    whiteBackground: string   // base64 or empty
  }
  aiRules: string
  createdAt: string
}

export interface CompaniesData {
  activeCompanyId: string
  companies: Company[]
}

// Keep AppSettings as alias for backward compatibility
export type AppSettings = {
  company: { name: string; description: string; websiteUrl: string }
  colors: { primary: string; secondary: string; accent: string }
  logos: { darkBackground: string; whiteBackground: string }
  aiRules: string
}

export interface GeneratorFormData {
  format: PostFormat
  theme: PostTheme
  subject: string
  writingStyle: WritingStyle
  emotionalTone: EmotionalTone
  persuasionTechnique: PersuasionTechnique
  variations: number
  useImage: boolean
  imageStyle: string
  generateCaption: boolean   // generate caption + hashtags
  showCta: boolean           // include CTA button in the post
}

export interface GenerateRequest {
  formData: GeneratorFormData
  /** ID da empresa a ser usada. Se omitido, usa a empresa ativa globalmente. */
  companyId?: string
}

export interface GenerateResponse {
  variations: string[]
  captions?: string[]   // NEW: one caption per variation (only if generateCaption=true)
  error?: string
}
