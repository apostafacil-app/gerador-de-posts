'use client'

import type { AppSettings } from '@/types'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}

export function CompanySection({ settings, onChange }: Props) {
  function update(field: keyof AppSettings['company'], value: string) {
    onChange({ ...settings, company: { ...settings.company, [field]: value } })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da empresa</label>
        <input
          type="text"
          value={settings.company.name}
          onChange={e => update('name', e.target.value)}
          placeholder="Ex: Apostemais"
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
        <textarea
          value={settings.company.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Ex: App que automatiza o lançamento de jogos no app das Loterias Caixa. Slogan: Aposte mais em menos tempo."
          rows={3}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Site</label>
        <input
          type="url"
          value={settings.company.websiteUrl}
          onChange={e => update('websiteUrl', e.target.value)}
          placeholder="https://apostemais.com.br"
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
        />
      </div>
    </div>
  )
}
