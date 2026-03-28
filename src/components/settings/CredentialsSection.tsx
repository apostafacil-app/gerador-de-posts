'use client'

import { useState } from 'react'

export function CredentialsSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não conferem.')
      return
    }

    if (newPassword.length < 8) {
      setErrorMsg('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (newUsername.length < 3) {
      setErrorMsg('O usuário deve ter pelo menos 3 caracteres.')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/auth/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newUsername, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao atualizar credenciais.')
        setStatus('error')
        return
      }

      setStatus('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setErrorMsg('Erro de conexão.')
      setStatus('error')
    }
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">Alterar credenciais</h2>
      <p className="text-sm text-gray-500 mb-5">
        Troque o usuário e senha de acesso ao sistema. A alteração persiste entre sessões.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Senha atual
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => { setCurrentPassword(e.target.value); setStatus('idle'); setErrorMsg('') }}
            placeholder="Digite sua senha atual"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
            required
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">Novos dados</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Novo usuário
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={e => { setNewUsername(e.target.value); setStatus('idle'); setErrorMsg('') }}
                placeholder="Mínimo 3 caracteres"
                autoComplete="username"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nova senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setStatus('idle'); setErrorMsg('') }}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setStatus('idle'); setErrorMsg('') }}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {(errorMsg || status === 'error') && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {errorMsg || 'Erro ao atualizar credenciais.'}
          </div>
        )}

        {status === 'success' && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            ✓ Credenciais atualizadas com sucesso!
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-2.5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
        >
          {status === 'loading' ? 'Salvando...' : 'Salvar credenciais'}
        </button>
      </form>
    </div>
  )
}
