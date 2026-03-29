import { getDb, COLLECTIONS, SYSTEM_DOCS } from './firebase'
import type { AIProvider } from '@/types'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
}

const VALID_PROVIDERS: AIProvider[] = ['claude', 'openai', 'gemini']

export async function readAIConfig(): Promise<AIConfig | null> {
  // 1. Variáveis de ambiente têm prioridade (Railway)
  const envProvider = process.env.AI_PROVIDER as AIProvider | undefined
  const envKey = process.env.AI_API_KEY
  if (envProvider && VALID_PROVIDERS.includes(envProvider) && envKey) {
    return { provider: envProvider, apiKey: envKey }
  }

  // 2. Firestore
  try {
    const db = getDb()
    const snap = await db.collection(COLLECTIONS.system).doc(SYSTEM_DOCS.aiConfig).get()
    if (snap.exists) {
      const d = snap.data()!
      if (VALID_PROVIDERS.includes(d.provider) && typeof d.apiKey === 'string' && d.apiKey.length > 0) {
        return { provider: d.provider, apiKey: d.apiKey }
      }
    }
  } catch {
    // Firebase não configurado
  }

  return null
}

export async function writeAIConfig(provider: AIProvider, apiKey: string): Promise<void> {
  const db = getDb()
  await db.collection(COLLECTIONS.system).doc(SYSTEM_DOCS.aiConfig).set({ provider, apiKey })
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return key.substring(0, 6) + '••••••••' + key.slice(-4)
}
