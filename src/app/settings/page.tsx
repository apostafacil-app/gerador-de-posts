'use client'

import { useEffect, useState, useCallback } from 'react'
import { CompanySection } from '@/components/settings/CompanySection'
import { ColorsSection } from '@/components/settings/ColorsSection'
import { LogoSection } from '@/components/settings/LogoSection'
import { AIRulesSection } from '@/components/settings/AIRulesSection'
import { CredentialsSection } from '@/components/settings/CredentialsSection'
import { AIConfigSection } from '@/components/settings/AIConfigSection'
import { loadSettings, saveSettings, getDefaultSettings } from '@/lib/storage'
import type { AppSettings } from '@/types'

type Tab = 'empresa' | 'marca' | 'logos' | 'regras' | 'ia' | 'credenciais'

const tabs: { id: Tab; label: string }[] = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'marca', label: 'Marca' },
  { id: 'logos', label: 'Logos' },
  { id: 'regras', label: 'Regras de IA' },
  { id: 'ia', label: '🤖 IA' },
  { id: 'credenciais', label: '🔑 Credenciais' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings)
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
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const showSaveButton = activeTab !== 'credenciais' && activeTab !== 'ia'

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure uma vez, use sempre</p>
        </div>
        {showSaveButton && (
          <button
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {saved ? '✓ Salvo!' : 'Salvar'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
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
        {activeTab === 'ia' && (
          <AIConfigSection />
        )}
        {activeTab === 'credenciais' && (
          <CredentialsSection />
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Empresa, cores, logos e regras são salvas no navegador. A chave de API fica no servidor.
      </p>
    </div>
  )
}
