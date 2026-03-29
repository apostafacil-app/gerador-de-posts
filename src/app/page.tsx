'use client'

import { useState } from 'react'
import { GeneratorForm } from '@/components/generator/GeneratorForm'
import { VariationGrid } from '@/components/generator/VariationGrid'
import type { GeneratorFormData, GenerateRequest, GenerateResponse, PostFormat } from '@/types'

export default function HomePage() {
  const [variations, setVariations] = useState<string[]>([])
  const [captions, setCaptions] = useState<string[] | undefined>(undefined)
  const [lastFormat, setLastFormat] = useState<PostFormat>('post')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: GeneratorFormData) {
    setIsLoading(true)
    setError(null)
    setVariations([])
    setCaptions(undefined)
    setLastFormat(formData.format)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData } satisfies GenerateRequest),
      })

      const data: GenerateResponse = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setVariations(data.variations)
        setCaptions(data.captions)
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Left: Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-6">Criar post</h1>
          <GeneratorForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Right: Results */}
        <div className="min-h-[400px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Gerando com IA...</p>
              <p className="text-gray-400 text-xs">Pode levar alguns segundos</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-5 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-lg">✕</span>
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-1">Erro ao gerar</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && variations.length > 0 && (
            <VariationGrid variations={variations} format={lastFormat} captions={captions} />
          )}

          {!isLoading && variations.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-80 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-2xl text-purple-500">
                ✦
              </div>
              <p className="text-gray-500 text-sm">Preencha o formulário e clique em Gerar Posts</p>
              <p className="text-gray-400 text-xs max-w-xs">
                As variações aparecerão aqui para você visualizar e exportar como PNG
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
