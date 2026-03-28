'use client'

import type { AppSettings } from '@/types'
import { getDefaultSettings } from '@/lib/storage'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}

export function AIRulesSection({ settings, onChange }: Props) {
  function reset() {
    if (confirm('Restaurar as regras padrão? Suas alterações serão perdidas.')) {
      onChange({ ...settings, aiRules: getDefaultSettings().aiRules })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            Este é o prompt/script base que orienta a IA na criação dos posts. Edite conforme sua estratégia de marca.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors flex-shrink-0 ml-4"
        >
          Restaurar padrão
        </button>
      </div>

      <textarea
        value={settings.aiRules}
        onChange={e => onChange({ ...settings, aiRules: e.target.value })}
        rows={22}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-300 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
        spellCheck={false}
      />

      <p className="text-xs text-zinc-500">
        {settings.aiRules.length.toLocaleString()} caracteres
      </p>
    </div>
  )
}
