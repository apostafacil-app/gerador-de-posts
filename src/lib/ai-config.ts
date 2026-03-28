/**
 * Configuração do provider de IA.
 * Prioridade: data/ai-config.json > env vars
 */
import fs from 'fs'
import path from 'path'
import type { AIProvider } from '@/types'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
}

const AI_CONFIG_FILE = path.join(process.cwd(), 'data', 'ai-config.json')

const VALID_PROVIDERS: AIProvider[] = ['claude', 'openai', 'gemini']

export function readAIConfig(): AIConfig | null {
  // 1. Arquivo local (persistido após configurar no app)
  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const raw = fs.readFileSync(AI_CONFIG_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (
        VALID_PROVIDERS.includes(parsed.provider) &&
        typeof parsed.apiKey === 'string' && parsed.apiKey.length > 0
      ) {
        return { provider: parsed.provider, apiKey: parsed.apiKey }
      }
    }
  } catch {
    // arquivo corrompido — cai para env vars
  }

  // 2. Variáveis de ambiente (Railway)
  const envProvider = process.env.AI_PROVIDER as AIProvider | undefined
  const envKey = process.env.AI_API_KEY
  if (envProvider && VALID_PROVIDERS.includes(envProvider) && envKey) {
    return { provider: envProvider, apiKey: envKey }
  }

  return null
}

export function writeAIConfig(provider: AIProvider, apiKey: string): void {
  const dir = path.dirname(AI_CONFIG_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify({ provider, apiKey }, null, 2), 'utf-8')
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return key.substring(0, 6) + '••••••••' + key.slice(-4)
}
