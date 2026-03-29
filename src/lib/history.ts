/**
 * Histórico de posts gerados — armazenado no localStorage do browser.
 * Máx. 50 entradas por empresa para não encher o storage.
 */

import type { PostFormat, PostTheme } from '@/types'

export interface HistoryEntry {
  id: string
  companyId: string
  subject: string
  format: PostFormat
  theme: PostTheme
  variations: string[]   // HTML completo de cada variação
  captions?: string[]
  createdAt: string      // ISO string
}

const MAX_ENTRIES = 50

function storageKey(companyId: string) {
  return `post-history-${companyId}`
}

export function saveToHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  }
  if (typeof window === 'undefined') return full

  try {
    const existing = getHistory(entry.companyId)
    const updated = [full, ...existing].slice(0, MAX_ENTRIES)
    localStorage.setItem(storageKey(entry.companyId), JSON.stringify(updated))
  } catch {
    // localStorage cheio: limpa metade mais antiga e tenta de novo
    try {
      const existing = getHistory(entry.companyId)
      const trimmed = [full, ...existing.slice(0, MAX_ENTRIES / 2 - 1)]
      localStorage.setItem(storageKey(entry.companyId), JSON.stringify(trimmed))
    } catch {
      // silencioso — histórico não é crítico
    }
  }
  return full
}

export function getHistory(companyId: string): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(companyId))
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export function deleteFromHistory(companyId: string, id: string): void {
  if (typeof window === 'undefined') return
  const updated = getHistory(companyId).filter(e => e.id !== id)
  localStorage.setItem(storageKey(companyId), JSON.stringify(updated))
}

export function clearHistory(companyId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(storageKey(companyId))
}
