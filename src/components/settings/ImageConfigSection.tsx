'use client'

import { useState, useEffect } from 'react'

export function ImageConfigSection() {
  const [apiKey, setApiKey] = useState('')
  const [maskedKey, setMaskedKey] = useState<string | null>(null)
  const [configured, setConfigured] = useState(false)
  const [source, setSource] = useState<'env' | 'firestore' | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/image-config')
      .then(r => r.json())
      .then(d => {
        setConfigured(d.configured)
        setMaskedKey(d.maskedKey)
        setSource(d.source)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setStatus('loading')

    try {
      const res = await fetch('/api/settings/image-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiImageKey: apiKey }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao salvar.')
        setStatus('error')
        return
      }

      setConfigured(true)
      setSource('firestore')
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

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">Geração de Imagem (DALL-E 3)</h2>
      <p className="text-sm text-gray-500 mb-5">
        Chave OpenAI exclusiva para gerar imagens com DALL-E 3.{' '}
        <span className="text-purple-600 font-medium">
          Se o provider de texto já for OpenAI, esta chave não é necessária.
        </span>
      </p>

      {/* Status atual */}
      {loading ? (
        <div className="mb-5 p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Verificando configuração...</span>
        </div>
      ) : configured ? (
        <div className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
          <span className="text-green-500 mt-0.5">✓</span>
          <div>
            <p className="text-sm font-medium text-green-800">Chave de imagem configurada</p>
            <p className="text-xs text-green-600 mt-0.5">
              {source === 'env' ? (
                'Lida da variável de ambiente OPENAI_IMAGE_API_KEY.'
              ) : (
                <>Chave: <code className="bg-green-100 px-1 rounded font-mono">{maskedKey}</code></>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <span className="text-amber-500 mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Não configurada</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Sem esta chave, a opção "Gerar imagem com IA" usará arte CSS como fallback.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Chave OpenAI (sk-...)
            {configured && <span className="text-gray-400 font-normal ml-1">(deixe vazio para manter a atual)</span>}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setStatus('idle'); setErrorMsg('') }}
              placeholder={configured ? 'Nova chave (opcional)' : 'sk-proj-...'}
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
            ✓ Chave salva com sucesso!
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading' || !apiKey.trim()}
          className="w-full py-2.5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          {status === 'loading' ? 'Salvando...' : configured ? 'Atualizar chave' : 'Salvar chave'}
        </button>
      </form>
    </div>
  )
}
