'use client'

import { useEffect, useState, useCallback } from 'react'
import { CompanySection } from '@/components/settings/CompanySection'
import { ColorsSection } from '@/components/settings/ColorsSection'
import { LogoSection } from '@/components/settings/LogoSection'
import { AIRulesSection } from '@/components/settings/AIRulesSection'
import { loadSettings, saveSettings } from '@/lib/storage'
import type { AppSettings } from '@/types'

type Tab = 'empresa' | 'marca' | 'logos' | 'regras'

const tabs: { id: Tab; label: string }[] = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'marca', label: 'Marca' },
  { id: 'logos', label: 'Logos' },
  { id: 'regras', label: 'Regras de IA' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('empresa')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const handleChange = useCallback((updated: AppSettings) => {
    setSettings(updated)
    setSaved(false)
  }, [])

  function handleSave() {
    if (!settings) return
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Configurações</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Configure uma vez, use sempre</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {saved ? '✓ Salvo!' : 'Salvar'}
        </button>
      </div>

      {/* Aviso sobre API key */}
      <div className="mb-5 p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 flex items-start gap-3">
        <span className="text-green-400 text-lg mt-0.5">🔒</span>
        <div>
          <p className="text-sm font-medium text-zinc-200">Chave de API configurada no servidor</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            O provider e a chave de IA são definidos via variáveis de ambiente no Railway — nunca expostos ao navegador.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        {activeTab === 'empresa' && (
          <CompanySection settings={settings} onChange={handleChange} />
        )}
        {activeTab === 'marca' && (
          <ColorsSection settings={settings} onChange={handleChange} />
        )}
        {activeTab === 'logos' && (
          <LogoSection settings={settings} onChange={handleChange} />
        )}
        {activeTab === 'regras' && (
          <AIRulesSection settings={settings} onChange={handleChange} />
        )}
      </div>

      <p className="text-xs text-zinc-600 mt-4 text-center">
        Empresa, cores, logos e regras são salvas no navegador. A chave de API fica no servidor.
      </p>
    </div>
  )
}
