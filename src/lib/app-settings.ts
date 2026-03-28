/**
 * Persistência server-side das configurações do app (empresa, cores, logos, regras).
 * Salvas em data/app-settings.json
 */
import fs from 'fs'
import path from 'path'
import type { AppSettings } from '@/types'
import { getDefaultSettings } from './storage'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'app-settings.json')

export function readAppSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as AppSettings
      const defaults = getDefaultSettings()
      return {
        company: { ...defaults.company, ...parsed.company },
        colors: { ...defaults.colors, ...parsed.colors },
        logos: { ...defaults.logos, ...parsed.logos },
        aiRules: parsed.aiRules ?? defaults.aiRules,
      }
    }
  } catch {
    // arquivo corrompido — retorna defaults
  }
  return getDefaultSettings()
}

export function writeAppSettings(settings: AppSettings): void {
  const dir = path.dirname(SETTINGS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}
