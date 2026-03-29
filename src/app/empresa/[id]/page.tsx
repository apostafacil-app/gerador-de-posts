'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Sparkles, Clock } from 'lucide-react'
import { GeneratorForm } from '@/components/generator/GeneratorForm'
import { VariationGrid } from '@/components/generator/VariationGrid'
import { HistoryTab } from '@/components/generator/HistoryTab'
import { saveToHistory } from '@/lib/history'
import type { GeneratorFormData, GenerateRequest, GenerateResponse, PostFormat } from '@/types'

interface CompanyCard {
  id: string
  name: string
  colors: { primary: string; secondary: string; accent: string }
  logoDark: string
  logoWhite: string
}

type Tab = 'criar' | 'historico'

export default function EmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = use(params)
  const router = useRouter()

  const [company, setCompany] = useState<CompanyCard | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [tab, setTab] = useState<Tab>('criar')
  const [variations, setVariations] = useState<string[]>([])
  const [captions, setCaptions] = useState<string[] | undefined>(undefined)
  const [lastFormat, setLastFormat] = useState<PostFormat>('post')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load company info
  useEffect(() => {
    fetch('/api/companies/public', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const found = (data.companies as CompanyCard[]).find(c => c.id === companyId)
        if (found) {
          setCompany(found)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
  }, [companyId])

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
        body: JSON.stringify({ formData, companyId } satisfies GenerateRequest),
      })

      const data: GenerateResponse = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setVariations(data.variations)
        setCaptions(data.captions)

        // Salva no histórico automaticamente
        if (data.variations.length > 0) {
          saveToHistory({
            companyId,
            subject: formData.subject,
            format: formData.format,
            theme: formData.theme,
            variations: data.variations,
            captions: data.captions,
          })
        }
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading company
  if (!company && !notFound) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Not found
  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <p className="text-gray-500 mb-4">Empresa não encontrada.</p>
        <button onClick={() => router.push('/')} className="text-purple-600 font-semibold hover:underline">
          ← Voltar
        </button>
      </div>
    )
  }

  const logo = company!.logoDark || company!.logoWhite

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">

      {/* Company header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Empresas
        </button>

        <span className="text-gray-300">/</span>

        {/* Company badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${company!.colors.primary}, ${company!.colors.secondary})` }}
          >
            {logo
              ? <img src={logo} alt={company!.name} className="w-full h-full object-contain p-0.5" />
              : <Building2 size={12} className="text-white/90" />
            }
          </div>
          <span className="text-sm font-semibold text-gray-800">{company!.name}</span>
          {/* Color dots */}
          <div className="flex gap-1 ml-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: company!.colors.primary }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: company!.colors.secondary }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: company!.colors.accent }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setTab('criar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'criar'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles size={15} />
          Criar post
        </button>
        <button
          onClick={() => setTab('historico')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'historico'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock size={15} />
          Histórico
        </button>
      </div>

      {/* ── TAB: CRIAR ── */}
      {tab === 'criar' && (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left: Form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
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
      )}

      {/* ── TAB: HISTÓRICO ── */}
      {tab === 'historico' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <HistoryTab companyId={companyId} />
        </div>
      )}
    </div>
  )
}
