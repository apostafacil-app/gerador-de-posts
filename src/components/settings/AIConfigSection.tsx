'use client'

import { useState, useEffect } from 'react'
import type { AIProvider } from '@/types'

const providers: { value: AIProvider; label: string; placeholder: string }[] = [
  { value: 'claude', label: 'Claude (Anthropic)', placeholder: 'sk-ant-api03-...' },
  { value: 'openai', label: 'OpenAI (GPT-4o)', placeholder: 'sk-proj-...' },
  { value: 'gemini', label: 'Gemini (Google)', placeholder: 'AIzaSy...' },
]

export function AIConfigSection() {
  const [provider, setProvider] = useState<AIProvider>('claude')
  const [apiKey, setApiKey] = useState('')
  const [maskedKey, setMaskedKey] = useState<string | null>(null)
  const [configured, setConfigured] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingCurrent, setLoadingCurrent] = useState(true)

  useEffect(() => {
    fetch('/api/settings/ai-config')
      .then(r => r.json())
      .then(data => {
        if (data.configured) {
          setConfigured(true)
          setProvider(data.provider)
          setMaskedKey(data.maskedKey)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCurrent(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setStatus('loading')

    try {
      const res = await fetch('/api/settings/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao salvar.')
        setStatus('error')
        return
      }

      setConfigured(true)
      setMaskedKey(apiKey.substring(0, 6) + '••••••••' + apiKey.slice(-4))
      setApiKey('')
      setShowKey(false)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setErrorMsg('Erro de conexão.')
      setStatus('error')
    }
  }

  const currentProvider = providers.find(p => p.value === provider)

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">Inteligência Artificial</h2>
      <p className="text-sm text-gray-500 mb-5">
        Configure o provider e a chave de API. A chave fica salva no servidor — nunca exposta ao navegador.
      </p>

      {/* Status atual */}
      {loadingCurrent ? (
        <div className="mb-5 p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Verificando configuração...</span>
        </div>
      ) : configured ? (
        <div className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
          <span className="text-green-500 mt-0.5">✓</span>
          <div>
            <p className="text-sm font-medium text-green-800">IA configurada</p>
            <p className="text-xs text-green-600 mt-0.5">
              Provider: <span className="font-medium">{providers.find(p => p.value === provider)?.label}</span>
              <br />
              Chave: <code className="bg-green-100 px-1 rounded font-mono">{maskedKey}</code>
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <span className="text-amber-500 mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-medium text-amber-800">IA não configurada</p>
            <p className="text-xs text-amber-600 mt-0.5">Configure abaixo para começar a gerar posts.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
          <div className="grid grid-cols-1 gap-2">
            {providers.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => { setProvider(p.value); setApiKey('') }}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                  provider === p.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className={`text-sm font-semibold ${provider === p.value ? 'text-purple-700' : 'text-gray-700'}`}>
                  {p.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 font-mono">{p.placeholder}</div>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Chave de API {configured && <span className="text-gray-400 font-normal">(deixe vazio para manter a atual)</span>}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setStatus('idle'); setErrorMsg('') }}
              placeholder={configured ? 'Nova chave (opcional)' : currentProvider?.placeholder}
              autoComplete="off"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              {showKey ? 'ocultar' : 'mostrar'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {status === 'success' && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            ✓ Configuração salva com sucesso!
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading' || (!apiKey.trim() && !configured)}
          className="w-full py-2.5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          {status === 'loading' ? 'Salvando...' : configured ? 'Atualizar configuração' : 'Salvar configuração'}
        </button>
      </form>
    </div>
  )
}
