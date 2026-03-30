'use client'

import { useEffect, useState } from 'react'
import { AIConfigSection } from '@/components/settings/AIConfigSection'
import { CredentialsSection } from '@/components/settings/CredentialsSection'
import type { Company, CompaniesData } from '@/types'
import {
  BASE_RULES,
  POST_DARK_ADDENDUM,
  POST_LIGHT_ADDENDUM,
  STORY_DARK_ADDENDUM,
  STORY_LIGHT_ADDENDUM,
} from '@/lib/default-rules'
import type { ModeKey } from '@/lib/system-settings'

const DEFAULT_COLORS = { primary: '#7b00d4', secondary: '#2d0055', accent: '#b388f0' }
const DEFAULT_LOGOS = { darkBackground: '', whiteBackground: '' }

const RULE_SECTIONS: { key: ModeKey; label: string; default: string; description: string }[] = [
  { key: 'base',        label: 'Base',         default: BASE_RULES,          description: 'Regras universais: arquétipos, componentes, logo, canvas, anti-fabricação.' },
  { key: 'post_dark',   label: 'Post Escuro',  default: POST_DARK_ADDENDUM,  description: 'Cores, fundos e tipografia para posts 1080×1350 tema escuro.' },
  { key: 'post_light',  label: 'Post Claro',   default: POST_LIGHT_ADDENDUM, description: 'Cores, fundos e tipografia para posts 1080×1350 tema claro.' },
  { key: 'story_dark',  label: 'Story Escuro', default: STORY_DARK_ADDENDUM, description: 'Cores, fundos e tipografia para stories 1080×1920 tema escuro.' },
  { key: 'story_light', label: 'Story Claro',  default: STORY_LIGHT_ADDENDUM, description: 'Cores, fundos e tipografia para stories 1080×1920 tema claro.' },
]

interface AllRulesState {
  base: string; post_dark: string; post_light: string; story_dark: string; story_light: string
}

function newCompanyTemplate(): Omit<Company, 'id' | 'createdAt'> {
  return {
    name: '',
    description: '',
    websiteUrl: '',
    colors: { ...DEFAULT_COLORS },
    logos: { ...DEFAULT_LOGOS },
    aiRules: BASE_RULES,
  }
}

function SystemRulesEditor() {
  const [allRules, setAllRules] = useState<AllRulesState>({
    base: BASE_RULES, post_dark: POST_DARK_ADDENDUM,
    post_light: POST_LIGHT_ADDENDUM, story_dark: STORY_DARK_ADDENDUM, story_light: STORY_LIGHT_ADDENDUM,
  })
  const [activeTab, setActiveTab] = useState<ModeKey>('base')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/settings/system-rules')
      .then(r => r.json())
      .then(d => {
        setAllRules({
          base:        d.base        || BASE_RULES,
          post_dark:   d.post_dark   || POST_DARK_ADDENDUM,
          post_light:  d.post_light  || POST_LIGHT_ADDENDUM,
          story_dark:  d.story_dark  || STORY_DARK_ADDENDUM,
          story_light: d.story_light || STORY_LIGHT_ADDENDUM,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/settings/system-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: activeTab, rules: allRules[activeTab] }),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error ?? 'Erro'); return }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch { setErr('Erro de conexão.') }
    finally { setSaving(false) }
  }

  function handleReset() {
    const section = RULE_SECTIONS.find(s => s.key === activeTab)
    if (section) setAllRules(prev => ({ ...prev, [activeTab]: section.default }))
    setSaved(false)
  }

  const activeSection = RULE_SECTIONS.find(s => s.key === activeTab)!

  if (loading) return <div className="h-8 bg-gray-100 rounded animate-pulse" />

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-700">Regras de IA do sistema</p>
        <p className="text-xs text-gray-400">Divididas em Base (universal) + 4 addendums por modo. Valem para todas as empresas.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {RULE_SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => { setActiveTab(s.key); setSaved(false); setErr('') }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === s.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Description + actions */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400 flex-1">{activeSection.description}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">
            Restaurar padrão
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
              saved ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        key={activeTab}
        value={allRules[activeTab]}
        onChange={e => { setAllRules(prev => ({ ...prev, [activeTab]: e.target.value })); setSaved(false) }}
        rows={16}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y transition-colors"
      />
      {err && <p className="text-xs text-red-500">{err}</p>}
      <p className="text-xs text-gray-400 text-right">{allRules[activeTab].length.toLocaleString()} chars</p>
    </div>
  )
}

export default function SettingsPage() {
  const [data, setData] = useState<CompaniesData | null>(null)
  const [selected, setSelected] = useState<Company | null>(null)
  const [form, setForm] = useState<Omit<Company, 'id' | 'createdAt'>>(newCompanyTemplate())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [sysOpen, setSysOpen] = useState(false)
  const [logoTab, setLogoTab] = useState<'dark' | 'white'>('dark')
  const [colorsOpen, setColorsOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then((d: CompaniesData) => {
        setData(d)
        const active = d.companies.find(c => c.id === d.activeCompanyId) ?? d.companies[0]
        if (active) { setSelected(active); setForm(toForm(active)) }
      })
  }, [])

  function toForm(c: Company): Omit<Company, 'id' | 'createdAt'> {
    return { name: c.name, description: c.description, websiteUrl: c.websiteUrl, colors: { ...c.colors }, logos: { ...c.logos }, aiRules: c.aiRules }
  }

  function selectCompany(c: Company) {
    setSelected(c)
    setForm(toForm(c))
    setSaved(false)
    setSaveError('')
  }

  function startNew() {
    setSelected(null)
    setForm(newCompanyTemplate())
    setSaved(false)
    setSaveError('')
  }

  async function handleActivate(id: string) {
    await fetch(`/api/companies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activate: true }) })
    setData(prev => prev ? { ...prev, activeCompanyId: id } : prev)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      if (selected) {
        // Update existing
        const res = await fetch(`/api/companies/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) { const d = await res.json(); setSaveError(d.error ?? 'Erro ao salvar.'); return }
        const updated: Company = await res.json()
        setData(prev => prev ? { ...prev, companies: prev.companies.map(c => c.id === updated.id ? updated : c) } : prev)
        setSelected(updated)
      } else {
        // Create new
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) { const d = await res.json(); setSaveError(d.error ?? 'Erro ao salvar.'); return }
        const created: Company = await res.json()
        setData(prev => prev ? { ...prev, companies: [...prev.companies, created] } : prev)
        setSelected(created)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { setSaveError('Erro de conexão.') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!selected) return
    if (!confirm(`Deletar "${selected.name}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/companies/${selected.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert(d.error); return }
      const updated = await fetch('/api/companies').then(r => r.json()) as CompaniesData
      setData(updated)
      const next = updated.companies.find(c => c.id === updated.activeCompanyId) ?? updated.companies[0]
      if (next) { setSelected(next); setForm(toForm(next)) }
      else { setSelected(null); setForm(newCompanyTemplate()) }
    } finally { setDeleting(false) }
  }

  function handleLogoUpload(theme: 'dark' | 'white', file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const base64 = e.target?.result as string
      setForm(prev => ({ ...prev, logos: { ...prev.logos, [theme === 'dark' ? 'darkBackground' : 'whiteBackground']: base64 } }))
    }
    reader.readAsDataURL(file)
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie suas empresas e configurações do sistema</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar — companies */}
        <div className="w-56 flex-shrink-0 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Empresas</p>
          {data.companies.map(c => (
            <button
              key={c.id}
              onClick={() => selectCompany(c)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 group ${
                selected?.id === c.id
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.colors.primary }} />
              <span className="truncate flex-1">{c.name || 'Sem nome'}</span>
              {data.activeCompanyId === c.id && (
                <span className="text-xs text-green-600 font-medium">ativa</span>
              )}
            </button>
          ))}
          <button
            onClick={startNew}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 ${
              selected === null ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            <span className="text-lg leading-none">+</span>
            <span>Nova empresa</span>
          </button>
        </div>

        {/* Right panel — company form */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                {selected ? 'Editar empresa' : 'Nova empresa'}
              </h2>
              <div className="flex items-center gap-2">
                {selected && data.activeCompanyId !== selected.id && (
                  <button
                    onClick={() => handleActivate(selected.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                  >
                    Definir como ativa
                  </button>
                )}
                {selected && data.companies.length > 1 && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {deleting ? 'Deletando...' : 'Deletar'}
                  </button>
                )}
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                      saved ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar empresa'}
                  </button>
                  {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome da empresa *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: AposteMais"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="O que a empresa faz? Qual o produto ou serviço principal?"
                rows={2}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors text-sm resize-none"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Website</label>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                placeholder="https://minhaempresa.com.br"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">A IA visita o site para criar copies mais autênticos</p>
            </div>

            {/* Colors — collapsible */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setColorsOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>Cores da marca</span>
                <span className="text-gray-400 text-xs">{colorsOpen ? '▲' : '▼'}</span>
              </button>
              {colorsOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                  {([
                    { key: 'primary', label: 'Cor primária' },
                    { key: 'secondary', label: 'Cor secundária' },
                    { key: 'accent', label: 'Cor de destaque' },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.colors[key]}
                        onChange={e => setForm(f => ({ ...f, colors: { ...f.colors, [key]: e.target.value } }))}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        <p className="text-xs text-gray-400 font-mono">{form.colors[key]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logos — collapsible */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100">
                Logos da empresa
              </div>
              <div className="px-4 pb-4 space-y-4">
                <div className="flex gap-2 mt-3">
                  {(['dark', 'white'] as const).map(theme => (
                    <button key={theme} onClick={() => setLogoTab(theme)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${logoTab === theme ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {theme === 'dark' ? 'Fundo escuro' : 'Fundo claro'}
                    </button>
                  ))}
                </div>
                {(['dark', 'white'] as const).map(theme => (
                  theme === logoTab && (
                    <div key={theme} className="space-y-2">
                      {form.logos[theme === 'dark' ? 'darkBackground' : 'whiteBackground'] ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={form.logos[theme === 'dark' ? 'darkBackground' : 'whiteBackground']}
                            alt="Logo"
                            className="h-12 object-contain"
                            style={{ background: theme === 'dark' ? '#1a0033' : '#f0f0f0', padding: 4, borderRadius: 8 }}
                          />
                          <button
                            onClick={() => setForm(f => ({ ...f, logos: { ...f.logos, [theme === 'dark' ? 'darkBackground' : 'whiteBackground']: '' } }))}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                          <span className="text-sm text-gray-500">Clique para enviar logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => { if (e.target.files?.[0]) handleLogoUpload(theme, e.target.files[0]) }}
                          />
                        </label>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>

          </div>

          {/* System settings */}
          <div className="mt-4">
            <button
              onClick={() => setSysOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-gray-200 shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>⚙️ Configurações do sistema</span>
              <span className="text-gray-400 text-xs">{sysOpen ? '▲' : '▼'}</span>
            </button>
            {sysOpen && (
              <div className="mt-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                <SystemRulesEditor />
                <div className="border-t border-gray-100 pt-6">
                  <AIConfigSection />
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <CredentialsSection />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
