'use client'

import { useRef, useState } from 'react'
import type { AppSettings } from '@/types'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}

interface LogoUploadProps {
  label: string
  subtitle: string
  bgClass: string
  value: string
  onUpload: (base64: string) => void
  onRemove: () => void
}

function LogoUpload({ label, subtitle, bgClass, value, onUpload, onRemove }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    const MAX = 800 * 1024 // 800KB
    if (file.size > MAX) {
      setError('Arquivo muito grande. Máximo 800KB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => onUpload(reader.result as string)
    reader.readAsDataURL(file)

    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-xs text-zinc-400">{subtitle}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {value ? 'Trocar' : 'Upload'}
          </button>
          {value && (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
            >
              Remover
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      <div className={`h-20 rounded-xl border-2 border-dashed flex items-center justify-center ${bgClass} ${value ? 'border-transparent' : 'border-zinc-600'}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Logo" className="h-12 max-w-[200px] object-contain" />
        ) : (
          <span className="text-zinc-500 text-sm">Nenhuma logo carregada</span>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function LogoSection({ settings, onChange }: Props) {
  return (
    <div className="space-y-6">
      <LogoUpload
        label="Logo para fundo escuro"
        subtitle="Versão com texto/ícone claro (fundo transparente ou escuro)"
        bgClass="bg-zinc-900"
        value={settings.logos.darkBackground}
        onUpload={v => onChange({ ...settings, logos: { ...settings.logos, darkBackground: v } })}
        onRemove={() => onChange({ ...settings, logos: { ...settings.logos, darkBackground: '' } })}
      />

      <div className="border-t border-zinc-800" />

      <LogoUpload
        label="Logo para fundo claro"
        subtitle="Versão com texto/ícone escuro (fundo transparente ou claro)"
        bgClass="bg-white"
        value={settings.logos.whiteBackground}
        onUpload={v => onChange({ ...settings, logos: { ...settings.logos, whiteBackground: v } })}
        onRemove={() => onChange({ ...settings, logos: { ...settings.logos, whiteBackground: '' } })}
      />

      <p className="text-xs text-zinc-500">
        As logos são salvas localmente no seu navegador como base64 e inseridas diretamente no HTML dos posts — sem URLs externas.
      </p>
    </div>
  )
}
