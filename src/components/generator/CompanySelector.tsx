'use client'

import { useEffect, useState, useCallback } from 'react'
import { Settings, Check, Building2 } from 'lucide-react'
import Link from 'next/link'

interface CompanyCard {
  id: string
  name: string
  colors: { primary: string; secondary: string; accent: string }
  logoDark: string
  logoWhite: string
}

interface PublicCompaniesResponse {
  activeCompanyId: string
  companies: CompanyCard[]
}

interface Props {
  /** Called whenever the selected company changes (passes the company ID) */
  onSelect?: (id: string) => void
}

export function CompanySelector({ onSelect }: Props) {
  const [data, setData] = useState<PublicCompaniesResponse | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/companies/public', { cache: 'no-store' })
      if (res.ok) {
        const json: PublicCompaniesResponse = await res.json()
        setData(json)
        // Default selection = globally active company
        setSelectedId(prev => prev ?? json.activeCompanyId)
        onSelect?.(json.activeCompanyId)
      }
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  function select(id: string) {
    if (id === selectedId) return
    setSelectedId(id)
    onSelect?.(id)
  }

  // Hide if only 1 company — nothing to choose
  if (!data || data.companies.length <= 1) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Gerar post para
        </p>
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors"
        >
          <Settings size={12} />
          Gerenciar empresas
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {data.companies.map(company => {
          const isSelected = company.id === selectedId
          const logo = company.logoDark || company.logoWhite

          return (
            <button
              key={company.id}
              onClick={() => select(company.id)}
              className={[
                'relative flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 w-[110px] cursor-pointer',
                isSelected
                  ? 'shadow-md scale-[1.03]'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white',
              ].join(' ')}
              style={
                isSelected
                  ? {
                      background: `linear-gradient(145deg, ${company.colors.primary}22 0%, ${company.colors.secondary}16 100%)`,
                      borderColor: company.colors.primary,
                      boxShadow: `0 4px 20px ${company.colors.primary}30`,
                    }
                  : {}
              }
            >
              {/* Selected checkmark */}
              {isSelected && (
                <span
                  className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full shadow text-white z-10"
                  style={{ background: company.colors.primary }}
                >
                  <Check size={11} strokeWidth={3} />
                </span>
              )}

              {/* Logo avatar */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${company.colors.primary} 0%, ${company.colors.secondary} 100%)`,
                }}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt={company.name}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <Building2 size={22} className="text-white/90" />
                )}
              </div>

              {/* Name */}
              <span
                className={[
                  'text-center text-[11px] font-semibold leading-tight line-clamp-2 w-full',
                  isSelected ? 'text-gray-900' : 'text-gray-500',
                ].join(' ')}
              >
                {company.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
