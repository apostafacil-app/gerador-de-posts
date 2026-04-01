'use client'

import { useState } from 'react'
import type { GeneratorFormData, WritingStyle, EmotionalTone, PersuasionTechnique } from '@/types'

interface Props {
  onSubmit: (data: GeneratorFormData) => void
  isLoading: boolean
  companyId: string
  companyColors: { primary: string; secondary: string; accent: string }
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
  generateCaption: false,
  showCta: true,
  ctaText: '',
}

export function GeneratorForm({ onSubmit, isLoading, companyId, companyColors }: Props) {
  const [form, setForm] = useState<GeneratorFormData>(defaultForm)
  const [suggestingTopics, setSuggestingTopics] = useState(false)
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])

  function set<K extends keyof GeneratorFormData>(key: K, value: GeneratorFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subject.trim() || form.subject.trim().length < 5) return
    onSubmit(form)
  }

  async function handleSuggestTopics() {
    setSuggestingTopics(true)
    try {
      const res = await fetch('/api/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      if (res.ok) {
        const data = await res.json()
        setSuggestedTopics(data.topics || [])
      }
    } catch {}
    finally { setSuggestingTopics(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Format */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Formato</label>
        <div className="grid grid-cols-2 gap-2">
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
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tema do post</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            {
              value: 'dark' as const,
              label: 'Dark',
              colors: [companyColors.primary, companyColors.secondary, companyColors.accent],
            },
            {
              value: 'white' as const,
              label: 'Claro',
              colors: ['#ffffff', '#f5f5f5', companyColors.accent],
            },
          ]).map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('theme', t.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                form.theme === t.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
              }`}
            >
              <div className="flex gap-1">
                {t.colors.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-gray-300" style={{ background: c }} />
                ))}
              </div>
              <span className="font-semibold text-sm">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Assunto do post <span className="text-red-400">*</span>
        </label>
        <textarea
          value={form.subject}
          onChange={e => set('subject', e.target.value)}
          placeholder="Ex: Economia de tempo ao lançar jogos pela Lotofácil..."
          rows={3}
          required
          minLength={5}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1">{form.subject.length} caracteres</p>

        {/* Suggest topics button */}
        <div className="flex justify-end -mt-2">
          <button
            type="button"
            onClick={handleSuggestTopics}
            disabled={suggestingTopics}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {suggestingTopics ? (
              <><span className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin inline-block" /> Buscando...</>
            ) : (
              <>✨ Sugerir temas</>
            )}
          </button>
        </div>

        {/* Topics suggestions */}
        {suggestedTopics.length > 0 && (
          <div className="space-y-2 mt-2">
            <p className="text-xs text-gray-500 font-medium">Clique para usar:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTopics.map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { set('subject', topic); setSuggestedTopics([]) }}
                  className="text-xs bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-2.5 py-1.5 hover:bg-purple-100 transition-colors text-left"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Writing Style */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Estilo de escrita</label>
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
              className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                form.writingStyle === s.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tom emocional</label>
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
              className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                form.emotionalTone === t.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Técnica de persuasão</label>
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
              className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                form.persuasionTechnique === p.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Variações</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => set('variations', n)}
              className={`w-12 h-10 rounded-lg border-2 font-bold text-sm transition-all ${
                form.variations === n
                  ? 'border-purple-500 bg-purple-600 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Image + Caption toggles */}
      <div className="space-y-3">
        {/* Image toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.useImage}
            onClick={() => set('useImage', !form.useImage)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.useImage ? 'bg-purple-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.useImage ? 'translate-x-5' : ''}`} />
          </button>
          <div>
            <span className="text-sm font-semibold text-gray-700">Incluir foto real</span>
            <p className="text-xs text-gray-400 mt-0.5">Buscada automaticamente pelo assunto do post</p>
          </div>
        </div>

        {form.useImage && (
          <input
            type="text"
            value={form.imageStyle}
            onChange={e => set('imageStyle', e.target.value)}
            placeholder="Detalhar a foto (ex: pessoas felizes, escritório, tecnologia...)"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
          />
        )}

        {/* Caption toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.generateCaption}
            onClick={() => set('generateCaption', !form.generateCaption)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.generateCaption ? 'bg-purple-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.generateCaption ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm font-semibold text-gray-700">Gerar legenda + hashtags</span>
        </div>

        {/* CTA toggle + custom text */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.showCta}
              onClick={() => set('showCta', !form.showCta)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.showCta ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.showCta ? 'translate-x-5' : ''}`} />
            </button>
            <div>
              <span className="text-sm font-semibold text-gray-700">Incluir botão CTA</span>
              {!form.showCta && (
                <p className="text-xs text-gray-400 mt-0.5">Apenas slogan no rodapé</p>
              )}
            </div>
          </div>
          {form.showCta && (
            <input
              type="text"
              value={form.ctaText}
              onChange={e => set('ctaText', e.target.value)}
              placeholder="Texto do botão (deixe vazio para automático)"
              maxLength={60}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !form.subject.trim()}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base transition-all shadow-md shadow-purple-200"
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
