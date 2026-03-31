/**
 * Histórico de posts gerados — armazenado no Firebase Firestore via API.
 * Retenção: 30 dias. Máx 50 entradas por empresa.
 * Acessível de qualquer dispositivo logado.
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
  expiresAt: string      // ISO string (createdAt + 30 dias)
}

/** Salva uma geração no histórico. Fire-and-forget — não lança exceção. */
export function saveToHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'expiresAt'>): void {
  if (typeof window === 'undefined') return
  fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => { /* histórico não é crítico */ })
}

/** Busca histórico de uma empresa (mais recentes primeiro, máx 50). */
export async function getHistory(companyId: string): Promise<HistoryEntry[]> {
  try {
    const res = await fetch(`/api/history?companyId=${encodeURIComponent(companyId)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.entries as HistoryEntry[]) ?? []
  } catch {
    return []
  }
}

/** Remove uma entrada do histórico pelo id. */
export async function deleteFromHistory(id: string): Promise<void> {
  await fetch(`/api/history?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
}

/** Remove todo o histórico de uma empresa. */
export async function clearHistory(companyId: string): Promise<void> {
  await fetch(`/api/history?companyId=${encodeURIComponent(companyId)}&all=true`, {
    method: 'DELETE',
  }).catch(() => {})
}
