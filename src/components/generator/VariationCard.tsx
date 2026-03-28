'use client'

import { useRef, useState } from 'react'
import type { PostFormat } from '@/types'

interface Props {
  html: string
  index: number
  format: PostFormat
}

export function VariationCard({ html, index, format }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [exporting, setExporting] = useState(false)

  const [nativeW, nativeH] = format === 'post' ? [1080, 1350] : [1080, 1920]
  const displayW = 270
  const scale = displayW / nativeW
  const displayH = Math.round(nativeH * scale)

  async function handleExport() {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return
    setExporting(true)

    try {
      // Dynamically import dom-to-image-more to avoid SSR issues
      const domtoimage = (await import('dom-to-image-more')).default

      const blob = await domtoimage.toBlob(iframe.contentDocument.body, {
        width: nativeW,
        height: nativeH,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${nativeW}px`,
          height: `${nativeH}px`,
        },
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `post-variacao-${index + 1}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao exportar:', err)
      alert('Erro ao exportar. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Variação {index + 1}
        </span>
        <span className="text-xs text-zinc-600">{nativeW}×{nativeH}px</span>
      </div>

      {/* Preview */}
      <div
        className="rounded-xl overflow-hidden border border-zinc-700 shadow-xl bg-zinc-900"
        style={{ width: displayW, height: displayH, flexShrink: 0 }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title={`Variação ${index + 1}`}
          sandbox="allow-same-origin"
          style={{
            width: nativeW,
            height: nativeH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            border: 'none',
            pointerEvents: 'none',
            display: 'block',
          }}
        />
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors border border-zinc-700 flex items-center justify-center gap-2"
        style={{ width: displayW }}
      >
        {exporting ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Exportando...
          </>
        ) : (
          <>
            ↓ Exportar PNG
          </>
        )}
      </button>
    </div>
  )
}
