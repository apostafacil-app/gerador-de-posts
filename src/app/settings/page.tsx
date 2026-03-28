'use client'

import { useEffect, useState, useCallback } from 'react'
import { CompanySection } from '@/components/settings/CompanySection'
import { ColorsSection } from '@/components/settings/ColorsSection'
import { LogoSection } from '@/components/settings/LogoSection'
import { AIProviderSection } from '@/components/settings/AIProviderSection'
import { AIRulesSection } from '@/components/settings/AIRulesSection'
import { loadSettings, saveSettings } from '@/lib/storage'
import type { AppSettings } from '@/types'

type Tab = 'empresa' | 'marca' | 'logos' | 'ia' | 'regras'

const tabs: { id: Tab; label: string }[] = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'marca', label: 'Marca' },
  { id: 'logos', label: 'Logos' },
  { id: 'ia', label: 'Inteligência Artificial' },
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
        {activeTab === 'ia' && (
          <AIProviderSection settings={settings} onChange={handleChange} />
        )}
        {activeTab === 'regras' && (
          <AIRulesSection settings={settings} onChange={handleChange} />
        )}
      </div>

      <p className="text-xs text-zinc-600 mt-4 text-center">
        Todas as configurações são salvas localmente no seu navegador — nenhum dado é enviado para servidores.
      </p>
    </div>
  )
}
