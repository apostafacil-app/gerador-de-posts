'use client'

import { useState, useEffect } from 'react'
import { Trash2, Download, Clock, ChevronRight } from 'lucide-react'
import { getHistory, deleteFromHistory, clearHistory, type HistoryEntry } from '@/lib/history'
import type { PostFormat } from '@/types'

interface Props {
  companyId: string
}

export function HistoryTab({ companyId }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [zoomed, setZoomed] = useState<{ html: string; format: PostFormat } | null>(null)

  useEffect(() => {
    setEntries(getHistory(companyId))
  }, [companyId])

  function handleDelete(id: string) {
    deleteFromHistory(companyId, id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function handleClearAll() {
    if (!confirm('Apagar todo o histórico desta empresa?')) return
    clearHistory(companyId)
    setEntries([])
  }

  async function handleExport(html: string, format: PostFormat, label: string) {
    const [nativeW, nativeH] = format === 'post' ? [1080, 1350] : [1080, 1920]
    const iframe = document.createElement('iframe')
    iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${nativeW}px;height:${nativeH}px;border:none;`
    document.body.appendChild(iframe)
    iframe.srcdoc = html
    await new Promise(r => setTimeout(r, 800))
    try {
      const domtoimage = (await import('dom-to-image-more')).default
      const blob = await domtoimage.toBlob(iframe.contentDocument!.body, {
        width: nativeW,
        height: nativeH,
        style: { transform: 'scale(1)', transformOrigin: 'top left', width: `${nativeW}px`, height: `${nativeH}px` },
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.download = `${label}.png`
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      document.body.removeChild(iframe)
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Clock size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Nenhum post gerado ainda</p>
        <p className="text-gray-400 text-xs max-w-xs">Os posts gerados aparecerão aqui automaticamente</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{entries.length}</span> post{entries.length !== 1 ? 's' : ''} gerado{entries.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={handleClearAll}
          className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
        >
          Limpar histórico
        </button>
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {entries.map(entry => {
          const [nativeW, nativeH] = entry.format === 'post' ? [1080, 1350] : [1080, 1920]
          const thumbW = 140
          const thumbScale = thumbW / nativeW
          const thumbH = Math.round(nativeH * thumbScale)

          return (
            <div key={entry.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              {/* Meta */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{entry.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{formatDate(entry.createdAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-xs text-gray-400 capitalize">{entry.format}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-xs text-gray-400">{entry.variations.length} variação{entry.variations.length !== 1 ? 'ões' : ''}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {entry.variations.map((html, vi) => (
                  <div key={vi} className="flex-shrink-0 flex flex-col gap-2">
                    {/* Thumb preview */}
                    <div
                      className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-zoom-in shadow-sm"
                      style={{ width: thumbW, height: thumbH }}
                      onClick={() => setZoomed({ html, format: entry.format })}
                      title="Clique para ampliar"
                    >
                      <iframe
                        srcDoc={html}
                        title={`Histórico variação ${vi + 1}`}
                        sandbox="allow-same-origin"
                        style={{
                          width: nativeW,
                          height: nativeH,
                          transform: `scale(${thumbScale})`,
                          transformOrigin: 'top left',
                          border: 'none',
                          pointerEvents: 'none',
                          display: 'block',
                        }}
                      />
                    </div>

                    {/* Download button */}
                    <button
                      onClick={() => handleExport(html, entry.format, `post-${entry.id}-v${vi + 1}`)}
                      className="flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                      style={{ width: thumbW }}
                    >
                      <Download size={11} />
                      PNG
                    </button>
                  </div>
                ))}
              </div>

              {/* Captions (if any) */}
              {entry.captions && entry.captions.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-purple-600 font-medium cursor-pointer flex items-center gap-1 list-none">
                    <ChevronRight size={12} className="transition-transform [[open]_summary_&]:rotate-90" />
                    Ver legenda{entry.captions.length > 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 space-y-2">
                    {entry.captions.map((cap, ci) => (
                      <p key={ci} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed">
                        {cap}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )
        })}
      </div>

      {/* Zoom modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setZoomed(null)}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomed(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm font-medium"
            >
              ✕ Fechar
            </button>
            {(() => {
              const [nW, nH] = zoomed.format === 'post' ? [1080, 1350] : [1080, 1920]
              const maxW = Math.min(window.innerWidth * 0.85, 540)
              const sc = maxW / nW
              return (
                <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ width: maxW, height: Math.round(nH * sc) }}>
                  <iframe
                    srcDoc={zoomed.html}
                    sandbox="allow-same-origin"
                    style={{ width: nW, height: nH, transform: `scale(${sc})`, transformOrigin: 'top left', border: 'none', pointerEvents: 'none', display: 'block' }}
                  />
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
