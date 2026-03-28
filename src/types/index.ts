export type AIProvider = 'claude' | 'openai' | 'gemini'
export type PostFormat = 'post' | 'story'
export type PostTheme = 'dark' | 'white'
export type WritingStyle = 'direto' | 'educativo' | 'provocativo' | 'empatico'
export type EmotionalTone = 'urgente' | 'empolgante' | 'exclusivo' | 'confiavel'
export type PersuasionTechnique = 'beneficio_direto' | 'escassez' | 'curiosidade' | 'prova_social'

export interface AppSettings {
  company: {
    name: string
    description: string
    websiteUrl: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  logos: {
    darkBackground: string
    whiteBackground: string
  }
  // ai.provider e ai.apiKey são gerenciados via variáveis de ambiente no servidor
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
}

export interface GenerateRequest {
  settings: AppSettings
  formData: GeneratorFormData
}

export interface GenerateResponse {
  variations: string[]
  error?: string
}
