'use client'

import { useEffect, useState, useCallback } from 'react'
import { CompanySection } from '@/components/settings/CompanySection'
import { ColorsSection } from '@/components/settings/ColorsSection'
import { LogoSection } from '@/components/settings/LogoSection'
import { AIRulesSection } from '@/components/settings/AIRulesSection'
import { CredentialsSection } from '@/components/settings/CredentialsSection'
import { AIConfigSection } from '@/components/settings/AIConfigSection'
import { getDefaultSettings } from '@/lib/storage'
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetch('/api/settings/app')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = useCallback((updated: AppSettings) => {
    setSettings(updated)
    setSaved(false)
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/settings/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const d = await res.json()
        setSaveError(d.error ?? 'Erro ao salvar.')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  const showSaveButton = activeTab !== 'credenciais' && activeTab !== 'ia'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure uma vez, disponível em qualquer dispositivo</p>
        </div>
        {showSaveButton && (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar'}
            </button>
            {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          </div>
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
        Configurações salvas no servidor — disponíveis em qualquer dispositivo após login.
      </p>
    </div>
  )
}
