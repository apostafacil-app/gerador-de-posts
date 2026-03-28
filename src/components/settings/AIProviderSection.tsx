'use client'

import { useState } from 'react'
import type { AppSettings, AIProvider } from '@/types'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}

const providers: { value: AIProvider; label: string; hint: string }[] = [
  { value: 'claude', label: 'Claude (Anthropic)', hint: 'console.anthropic.com → API Keys' },
  { value: 'openai', label: 'ChatGPT (OpenAI)', hint: 'platform.openai.com → API Keys' },
  { value: 'gemini', label: 'Gemini (Google)', hint: 'aistudio.google.com → Get API Key' },
]

export function AIProviderSection({ settings, onChange }: Props) {
  const [showKey, setShowKey] = useState(false)

  function update<K extends keyof AppSettings['ai']>(field: K, value: AppSettings['ai'][K]) {
    onChange({ ...settings, ai: { ...settings.ai, [field]: value } })
  }

  const selected = providers.find(p => p.value === settings.ai.provider)

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Provedor de IA</label>
        <div className="grid grid-cols-3 gap-2">
          {providers.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => update('provider', p.value)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors text-left ${
                settings.ai.provider === p.value
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {selected && (
          <p className="text-xs text-zinc-500 mt-1.5">
            Obtenha sua chave em: <span className="text-zinc-400">{selected.hint}</span>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Chave de API</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={settings.ai.apiKey}
            onChange={e => update('apiKey', e.target.value)}
            placeholder="sk-... ou AIza..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 pr-16 text-white placeholder-zinc-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
          >
            {showKey ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          A chave é salva localmente no seu navegador e enviada diretamente para a IA. Nunca é armazenada em servidor.
        </p>
      </div>
    </div>
  )
}
