'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, Settings, ChevronRight } from 'lucide-react'

interface CompanyCard {
  id: string
  name: string
  colors: { primary: string; secondary: string; accent: string }
  logoDark: string
  logoWhite: string
}

export default function HomePage() {
  const [companies, setCompanies] = useState<CompanyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/companies/public', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          console.error('[home] API error:', data.error)
          setFetchError(data.error)
        }
        setCompanies(data.companies ?? [])
        setLoading(false)
      })
      .catch(err => {
        console.error('[home] fetch error:', err)
        setFetchError(String(err))
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas empresas</h1>
          <p className="text-sm text-gray-500 mt-1">Selecione uma empresa para criar posts</p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-purple-300 hover:text-purple-600 hover:shadow-sm transition-all"
        >
          <Settings size={14} />
          Configurações
        </Link>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Erro ao carregar empresas:</strong> {fetchError}
        </div>
      )}

      {/* Empty state */}
      {companies.length === 0 && !fetchError && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
            <Building2 size={32} className="text-purple-500" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">Nenhuma empresa cadastrada</p>
            <p className="text-sm text-gray-500 mt-1">Cadastre a primeira empresa para começar a gerar posts</p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm shadow-md shadow-purple-200 hover:from-purple-500 hover:to-violet-500 transition-all"
          >
            <Plus size={16} />
            Cadastrar empresa
          </Link>
        </div>
      )}

      {/* Company grid */}
      {companies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {companies.map(company => {
            const logo = company.logoDark || company.logoWhite

            return (
              <button
                key={company.id}
                onClick={() => router.push(`/empresa/${company.id}`)}
                className="group relative flex flex-col bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-left"
              >
                {/* Top banner with brand gradient */}
                <div
                  className="relative h-28 w-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${company.colors.primary} 0%, ${company.colors.secondary} 100%)`,
                  }}
                >
                  {/* Decorative circles */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
                    style={{ background: company.colors.accent }} />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10"
                    style={{ background: company.colors.accent }} />

                  {/* Logo */}
                  {logo ? (
                    <img src={logo} alt={company.name} className="relative w-28 h-28 object-contain drop-shadow-xl" />
                  ) : (
                    <Building2 size={48} className="relative text-white/90 drop-shadow-lg" />
                  )}

                  {/* Arrow on hover */}
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5">
                    <ChevronRight size={14} className="text-white" />
                  </div>
                </div>

                {/* Bottom info */}
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-snug truncate">{company.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Clique para criar posts</p>
                  </div>
                  {/* Color palette */}
                  <div className="flex gap-1 flex-shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-white" style={{ background: company.colors.primary }} />
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-white" style={{ background: company.colors.secondary }} />
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-white" style={{ background: company.colors.accent }} />
                  </div>
                </div>
              </button>
            )
          })}

          {/* Add company card */}
          <Link
            href="/settings"
            className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-purple-300 hover:text-purple-500 hover:-translate-y-1.5 hover:bg-purple-50/50 transition-all duration-300 min-h-[180px]"
          >
            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-current flex items-center justify-center">
              <Plus size={22} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Nova empresa</p>
              <p className="text-xs opacity-60 mt-0.5">Adicionar cliente</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
