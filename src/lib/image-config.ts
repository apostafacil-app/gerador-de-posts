/**
 * Configuração da chave OpenAI para geração de imagens (DALL-E 3).
 * Prioridade: env var OPENAI_IMAGE_API_KEY → Firestore → null
 */

import { getDb, COLLECTIONS, SYSTEM_DOCS } from './firebase'

const DOC_IMAGE_CONFIG = 'imageConfig'

export interface ImageApiConfig {
  openaiImageKey: string
}

export async function readImageApiKey(): Promise<string | null> {
  // 1. Variável de ambiente tem prioridade
  const envKey = process.env.OPENAI_IMAGE_API_KEY
  if (envKey) return envKey

  // 2. Firestore
  try {
    const db = getDb()
    const snap = await db.collection(COLLECTIONS.system).doc(DOC_IMAGE_CONFIG).get()
    if (snap.exists) {
      const d = snap.data()!
      if (typeof d.openaiImageKey === 'string' && d.openaiImageKey.length > 10) {
        return d.openaiImageKey
      }
    }
  } catch {
    // Firebase não configurado
  }

  return null
}

export async function writeImageApiKey(key: string): Promise<void> {
  const db = getDb()
  await db.collection(COLLECTIONS.system).doc(DOC_IMAGE_CONFIG).set({ openaiImageKey: key })
}

export async function getImageApiStatus(): Promise<{
  configured: boolean
  source: 'env' | 'firestore' | null
  maskedKey: string | null
}> {
  if (process.env.OPENAI_IMAGE_API_KEY) {
    const k = process.env.OPENAI_IMAGE_API_KEY
    return {
      configured: true,
      source: 'env',
      maskedKey: k.substring(0, 6) + '••••••••' + k.slice(-4),
    }
  }

  try {
    const db = getDb()
    const snap = await db.collection(COLLECTIONS.system).doc(DOC_IMAGE_CONFIG).get()
    if (snap.exists) {
      const d = snap.data()!
      const k: string = d.openaiImageKey ?? ''
      if (k.length > 10) {
        return {
          configured: true,
          source: 'firestore',
          maskedKey: k.substring(0, 6) + '••••••••' + k.slice(-4),
        }
      }
    }
  } catch { /* ignore */ }

  return { configured: false, source: null, maskedKey: null }
}
