'use client'

import { useState } from 'react'
import type { GeneratorFormData, WritingStyle, EmotionalTone, PersuasionTechnique } from '@/types'

interface Props {
  onSubmit: (data: GeneratorFormData) => void
  isLoading: boolean
}

const defaultForm: GeneratorFormData = {
  format: 'post',
  theme: 'dark',
  subject: '',
  writingStyle: 'direto',
  emotionalTone: 'empolgante',
  persuasionTechnique: 'beneficio_direto',
  variations: 2,
  useImage: false,
  imageStyle: '',
}

export function GeneratorForm({ onSubmit, isLoading }: Props) {
  const [form, setForm] = useState<GeneratorFormData>(defaultForm)

  function set<K extends keyof GeneratorFormData>(key: K, value: GeneratorFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject.trim() || form.subject.trim().length < 5) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Format */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">Formato</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'post', label: 'Post', dim: '1080 × 1350px', icon: '▬' },
            { value: 'story', label: 'Story', dim: '1080 × 1920px', icon: '▮' },
          ] as const).map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => set('format', f.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                form.format === f.value
                  ? 'border-purple-500 bg-purple-950/40 text-white'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <span className="text-2xl leading-none">{f.icon}</span>
              <span className="font-semibold text-sm">{f.label}</span>
              <span className="text-xs opacity-60">{f.dim}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">Tema</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'dark', label: 'Dark', colors: ['#1a0033', '#7b00d4'] },
            { value: 'white', label: 'Claro', colors: ['#ffffff', '#f0f0f0'] },
          ] as const).map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('theme', t.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                form.theme === t.value
                  ? 'border-purple-500 bg-purple-950/40 text-white'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <div className="flex gap-1">
                {t.colors.map(c => (
                  <div key={c} className="w-4 h-4 rounded-full border border-zinc-600" style={{ background: c }} />
                ))}
              </div>
              <span className="font-semibold text-sm">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          Assunto do post <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.subject}
          onChange={e => set('subject', e.target.value)}
          placeholder="Ex: Economia de tempo ao lançar jogos pela Lotofácil — o usuário perde horas lançando manualmente..."
          rows={3}
          required
          minLength={5}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
        <p className="text-xs text-zinc-500 mt-1">{form.subject.length} caracteres</p>
      </div>

      {/* Writing Style */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">Estilo de escrita</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'direto', label: 'Direto', desc: 'Objetivo e sem rodeios' },
            { value: 'educativo', label: 'Educativo', desc: 'Problema → solução' },
            { value: 'provocativo', label: 'Provocativo', desc: 'Desafia o status quo' },
            { value: 'empatico', label: 'Empático', desc: 'Linguagem próxima' },
          ] as const).map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => set('writingStyle', s.value as WritingStyle)}
              className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                form.writingStyle === s.value
                  ? 'border-purple-500 bg-purple-950/40 text-white'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <div className="text-sm font-semibold">{s.label}</div>
              <div className="text-xs opacity-60">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Emotional Tone */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">Tom emocional</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'urgente', label: 'Urgente', desc: 'Agir agora' },
            { value: 'empolgante', label: 'Empolgante', desc: 'Energia e entusiasmo' },
            { value: 'exclusivo', label: 'Exclusivo', desc: 'Premium / restrito' },
            { value: 'confiavel', label: 'Confiável', desc: 'Seguro e sólido' },
          ] as const).map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('emotionalTone', t.value as EmotionalTone)}
              className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                form.emotionalTone === t.value
                  ? 'border-purple-500 bg-purple-950/40 text-white'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="text-xs opacity-60">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Persuasion */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">Técnica de persuasão</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'beneficio_direto', label: 'Benefício direto', desc: 'Entrega o valor imediato' },
            { value: 'escassez', label: 'Escassez', desc: 'Vagas / tempo limitado' },
            { value: 'curiosidade', label: 'Curiosidade', desc: 'Cliffhanger e revelação' },
            { value: 'prova_social', label: 'Prova social', desc: 'Clientes e resultados' },
          ] as const).map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => set('persuasionTechnique', p.value as PersuasionTechnique)}
              className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                form.persuasionTechnique === p.value
                  ? 'border-purple-500 bg-purple-950/40 text-white'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <div className="text-sm font-semibold">{p.label}</div>
              <div className="text-xs opacity-60">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Variations */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">Variações</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => set('variations', n)}
              className={`w-12 h-10 rounded-lg border-2 font-bold text-sm transition-all ${
                form.variations === n
                  ? 'border-purple-500 bg-purple-600 text-white'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Image */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.useImage}
            onClick={() => set('useImage', !form.useImage)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.useImage ? 'bg-purple-600' : 'bg-zinc-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.useImage ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm font-semibold text-zinc-300">Usar imagem / arte visual</span>
        </div>

        {form.useImage && (
          <input
            type="text"
            value={form.imageStyle}
            onChange={e => set('imageStyle', e.target.value)}
            placeholder="Ex: gradiente geométrico abstrato, fundo com círculos luminosos..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !form.subject.trim()}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-all shadow-lg shadow-purple-900/30"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Gerando posts...
          </span>
        ) : (
          'Gerar Posts'
        )}
      </button>
    </form>
  )
}
