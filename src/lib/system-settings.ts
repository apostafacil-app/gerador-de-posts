/**
 * Regras de IA globais — valem para todas as empresas.
 * Salvas em data/system-settings.json
 */
import fs from 'fs'
import path from 'path'
import { DEFAULT_AI_RULES } from './default-rules'

const SYSTEM_SETTINGS_FILE = path.join(process.cwd(), 'data', 'system-settings.json')

export function readSystemRules(): string {
  try {
    if (fs.existsSync(SYSTEM_SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SYSTEM_SETTINGS_FILE, 'utf-8'))
      if (typeof data.aiRules === 'string' && data.aiRules.length > 50) return data.aiRules
    }
  } catch {}
  return DEFAULT_AI_RULES
}

export function writeSystemRules(aiRules: string): void {
  const dir = path.dirname(SYSTEM_SETTINGS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(SYSTEM_SETTINGS_FILE, JSON.stringify({ aiRules }, null, 2), 'utf-8')
}
