'use client'

import { useRef, useState } from 'react'
import type { PostFormat } from '@/types'
import { VariationCard } from './VariationCard'

interface Props {
  variations: string[]
  format: PostFormat
}

export function VariationGrid({ variations, format }: Props) {
  const [exportingAll, setExportingAll] = useState(false)

  const [nativeW, nativeH] = format === 'post' ? [1080, 1350] : [1080, 1920]

  async function handleExportAll() {
    setExportingAll(true)
    const domtoimage = (await import('dom-to-image-more')).default
    const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe[title^="Variação"]')

    for (let i = 0; i < iframes.length; i++) {
      const body = iframes[i].contentDocument?.body
      if (!body) continue
      try {
        const blob = await domtoimage.toBlob(body, {
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
        link.download = `post-variacao-${i + 1}.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
        // Small delay between downloads to avoid browser blocking
        await new Promise(r => setTimeout(r, 400))
      } catch (err) {
        console.error(`Erro ao exportar variação ${i + 1}:`, err)
      }
    }
    setExportingAll(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          {variations.length} variação{variations.length !== 1 ? 'ões' : ''} gerada{variations.length !== 1 ? 's' : ''}
        </h2>
        {variations.length > 1 && (
          <button
            onClick={handleExportAll}
            disabled={exportingAll}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {exportingAll ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              '↓ Exportar Todas'
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        {variations.map((html, i) => (
          <VariationCard key={i} html={html} index={i} format={format} />
        ))}
      </div>
    </div>
  )
}
