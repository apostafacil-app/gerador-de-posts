'use client'

import { useRef, useState } from 'react'
import type { PostFormat } from '@/types'

interface Props {
  html: string
  index: number
  format: PostFormat
  caption?: string
}

export function VariationCard({ html, index, format, caption }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const zoomRef = useRef<HTMLIFrameElement>(null)
  const [exporting, setExporting] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [copied, setCopied] = useState(false)

  const [nativeW, nativeH] = format === 'post' ? [1080, 1350] : [1080, 1920]
  const displayW = 270
  const scale = displayW / nativeW
  const displayH = Math.round(nativeH * scale)

  // Zoom display: fit in 80vw x 85vh
  const zoomMaxW = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.8, 540) : 540
  const zoomScale = zoomMaxW / nativeW
  const zoomDisplayH = Math.round(nativeH * zoomScale)

  async function handleExport() {
    const iframe = iframeRef.current
    if (!iframe?.contentDocument?.body) return
    setExporting(true)
    try {
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

  async function handleCopyCaption() {
    if (!caption) return
    await navigator.clipboard.writeText(caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Label */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Variação {index + 1}
          </span>
          <span className="text-xs text-gray-400">{nativeW}×{nativeH}px</span>
        </div>

        {/* Preview — click to zoom */}
        <div
          className="rounded-xl overflow-hidden border border-gray-200 shadow-md bg-gray-100 cursor-zoom-in"
          style={{ width: displayW, height: displayH, flexShrink: 0 }}
          onClick={() => setZoomed(true)}
          title="Clique para ampliar"
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
          className="w-full py-2 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-medium transition-colors border border-gray-200 shadow-sm flex items-center justify-center gap-2"
          style={{ width: displayW }}
        >
          {exporting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Exportando...
            </>
          ) : (
            <>↓ Exportar PNG</>
          )}
        </button>

        {/* Caption */}
        {caption && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2" style={{ width: displayW }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Legenda</span>
              <button
                onClick={handleCopyCaption}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                {copied ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{caption}</p>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomed(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm font-medium flex items-center gap-1"
            >
              ✕ Fechar
            </button>
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ width: zoomMaxW, height: zoomDisplayH }}
            >
              <iframe
                ref={zoomRef}
                srcDoc={html}
                title={`Variação ${index + 1} — ampliada`}
                sandbox="allow-same-origin"
                style={{
                  width: nativeW,
                  height: nativeH,
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top left',
                  border: 'none',
                  pointerEvents: 'none',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
