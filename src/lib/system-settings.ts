import { getDb, COLLECTIONS, SYSTEM_DOCS } from './firebase'
import {
  BASE_RULES,
  POST_DARK_ADDENDUM,
  POST_LIGHT_ADDENDUM,
  STORY_DARK_ADDENDUM,
  STORY_LIGHT_ADDENDUM,
  getModeAddendum,
} from './default-rules'

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type ModeKey = 'base' | 'post_dark' | 'post_light' | 'story_dark' | 'story_light'

export interface AllRules {
  base:        string
  post_dark:   string
  post_light:  string
  story_dark:  string
  story_light: string
}

// Mapa: chave semântica → ID do documento no Firestore
const RULE_DOC: Record<ModeKey, string> = {
  base:        SYSTEM_DOCS.baseRules,
  post_dark:   SYSTEM_DOCS.postDark,
  post_light:  SYSTEM_DOCS.postLight,
  story_dark:  SYSTEM_DOCS.storyDark,
  story_light: SYSTEM_DOCS.storyLight,
}

// Defaults para cada seção
const DEFAULTS: AllRules = {
  base:        BASE_RULES,
  post_dark:   POST_DARK_ADDENDUM,
  post_light:  POST_LIGHT_ADDENDUM,
  story_dark:  STORY_DARK_ADDENDUM,
  story_light: STORY_LIGHT_ADDENDUM,
}

// ─── Leitura de uma seção ─────────────────────────────────────────────────────
export async function readRuleSection(section: ModeKey): Promise<string> {
  try {
    const db = getDb()
    const snap = await db.collection(COLLECTIONS.system).doc(RULE_DOC[section]).get()
    if (snap.exists) {
      const rules = snap.data()?.rules
      if (typeof rules === 'string' && rules.length > 50) return rules
    }
  } catch {
    // Firebase não configurado — usa padrão
  }
  return DEFAULTS[section]
}

// ─── Escrita de uma seção ─────────────────────────────────────────────────────
export async function writeRuleSection(section: ModeKey, rules: string): Promise<void> {
  const db = getDb()
  await db
    .collection(COLLECTIONS.system)
    .doc(RULE_DOC[section])
    .set({ rules }, { merge: true })
}

// ─── Leitura de todas as seções ───────────────────────────────────────────────
export async function readAllRules(): Promise<AllRules> {
  const [base, post_dark, post_light, story_dark, story_light] = await Promise.all([
    readRuleSection('base'),
    readRuleSection('post_dark'),
    readRuleSection('post_light'),
    readRuleSection('story_dark'),
    readRuleSection('story_light'),
  ])
  return { base, post_dark, post_light, story_dark, story_light }
}

// ─── Prompt completo: base + addendum do modo ─────────────────────────────────
export async function readPromptForMode(
  format: 'post' | 'story',
  theme: 'dark' | 'white'
): Promise<{ baseRules: string; modeAddendum: string }> {
  const modeKey: ModeKey =
    format === 'post' && theme === 'dark'   ? 'post_dark'   :
    format === 'post' && theme === 'white'  ? 'post_light'  :
    format === 'story' && theme === 'dark'  ? 'story_dark'  :
                                              'story_light'

  const [baseRules, modeAddendum] = await Promise.all([
    readRuleSection('base'),
    readRuleSection(modeKey),
  ])
  return { baseRules, modeAddendum }
}

// ─── Retrocompatibilidade (legado) ────────────────────────────────────────────
/** @deprecated Use readRuleSection('base') */
export async function readSystemRules(): Promise<string> {
  return readRuleSection('base')
}

/** @deprecated Use writeRuleSection('base', rules) */
export async function writeSystemRules(aiRules: string): Promise<void> {
  return writeRuleSection('base', aiRules)
}
