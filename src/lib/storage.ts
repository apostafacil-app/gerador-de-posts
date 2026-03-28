import type { AppSettings } from '@/types'
import { DEFAULT_AI_RULES } from './default-rules'

const SETTINGS_KEY = 'gerador_posts_settings'

export function getDefaultSettings(): AppSettings {
  return {
    company: {
      name: '',
      description: '',
      websiteUrl: '',
    },
    colors: {
      primary: '#7b00d4',
      secondary: '#2d0055',
      accent: '#a855f7',
    },
    logos: {
      darkBackground: '',
      whiteBackground: '',
    },
    aiRules: DEFAULT_AI_RULES,
  }
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return getDefaultSettings()
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return getDefaultSettings()
  try {
    const parsed = JSON.parse(raw) as AppSettings
    const defaults = getDefaultSettings()
    return {
      company: { ...defaults.company, ...parsed.company },
      colors: { ...defaults.colors, ...parsed.colors },
      logos: { ...defaults.logos, ...parsed.logos },
      aiRules: parsed.aiRules ?? defaults.aiRules,
    }
  } catch {
    return getDefaultSettings()
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
