'use client'

import type { AppSettings } from '@/types'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}

interface ColorFieldProps {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
}

function ColorField({ label, description, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 bg-transparent p-0.5"
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => {
          const v = e.target.value
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
        }}
        className="w-28 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
        maxLength={7}
      />
    </div>
  )
}

export function ColorsSection({ settings, onChange }: Props) {
  function update(field: keyof AppSettings['colors'], value: string) {
    onChange({ ...settings, colors: { ...settings.colors, [field]: value } })
  }

  return (
    <div className="space-y-4">
      <ColorField
        label="Cor primária"
        description="Fundo principal do post dark"
        value={settings.colors.primary}
        onChange={v => update('primary', v)}
      />
      <ColorField
        label="Cor secundária"
        description="Gradiente e fundos de card"
        value={settings.colors.secondary}
        onChange={v => update('secondary', v)}
      />
      <ColorField
        label="Cor de destaque"
        description="Botões CTA e elementos de ênfase"
        value={settings.colors.accent}
        onChange={v => update('accent', v)}
      />

      {/* Preview */}
      <div className="mt-6 rounded-xl overflow-hidden border border-gray-200">
        <div className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50 border-b border-gray-200">Preview das cores</div>
        <div
          className="h-20 flex items-center justify-center gap-4 px-6"
          style={{ background: `linear-gradient(135deg, ${settings.colors.primary} 0%, ${settings.colors.secondary} 100%)` }}
        >
          <span
            className="text-white font-bold text-sm px-4 py-1.5 rounded-full"
            style={{ background: settings.colors.accent }}
          >
            CTA Destaque
          </span>
          <span className="text-white text-sm opacity-75">Texto sobre fundo</span>
        </div>
      </div>
    </div>
  )
}
