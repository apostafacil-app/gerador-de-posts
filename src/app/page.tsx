'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GeneratorForm } from '@/components/generator/GeneratorForm'
import { VariationGrid } from '@/components/generator/VariationGrid'
import { loadSettings } from '@/lib/storage'
import type { AppSettings, GeneratorFormData, GenerateRequest, GenerateResponse, PostFormat } from '@/types'

export default function HomePage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [variations, setVariations] = useState<string[]>([])
  const [lastFormat, setLastFormat] = useState<PostFormat>('post')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const hasApiKey = settings?.ai?.apiKey?.trim()

  async function handleSubmit(formData: GeneratorFormData) {
    if (!settings) return
    setIsLoading(true)
    setError(null)
    setVariations([])
    setLastFormat(formData.format)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, formData } satisfies GenerateRequest),
      })

      const data: GenerateResponse = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setVariations(data.variations)
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Settings warning */}
      {settings && !hasApiKey && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-400">⚠</span>
            <span className="text-sm text-amber-300">
              Configure sua chave de API antes de gerar posts.
            </span>
          </div>
          <Link
            href="/settings"
            className="text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
          >
            Configurar agora
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        {/* Left: Form */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <h1 className="text-lg font-bold text-white mb-6">Criar post</h1>
          <GeneratorForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Right: Results */}
        <div className="min-h-[400px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
              <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-zinc-400 text-sm">Gerando com IA...</p>
              <p className="text-zinc-600 text-xs">Pode levar alguns segundos</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-5 rounded-xl bg-red-950/40 border border-red-800/50">
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-lg">✕</span>
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Erro ao gerar</p>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && variations.length > 0 && (
            <VariationGrid variations={variations} format={lastFormat} />
          )}

          {!isLoading && variations.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-80 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl">
                ✦
              </div>
              <p className="text-zinc-400 text-sm">Preencha o formulário e clique em Gerar Posts</p>
              <p className="text-zinc-600 text-xs max-w-xs">
                As variações aparecerão aqui para você visualizar e exportar como PNG
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
