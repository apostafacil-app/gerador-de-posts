import { getDb, COLLECTIONS, SYSTEM_DOCS } from './firebase'
import { DEFAULT_AI_RULES } from './default-rules'

export async function readSystemRules(): Promise<string> {
  try {
    const db = getDb()
    const snap = await db.collection(COLLECTIONS.system).doc(SYSTEM_DOCS.settings).get()
    if (snap.exists) {
      const rules = snap.data()?.aiRules
      if (typeof rules === 'string' && rules.length > 50) return rules
    }
  } catch {
    // Firebase não configurado — usa padrão
  }
  return DEFAULT_AI_RULES
}

export async function writeSystemRules(aiRules: string): Promise<void> {
  const db = getDb()
  await db.collection(COLLECTIONS.system).doc(SYSTEM_DOCS.settings).set({ aiRules }, { merge: true })
}
