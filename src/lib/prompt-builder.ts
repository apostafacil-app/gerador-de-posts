import type { AppSettings, GeneratorFormData } from '@/types'

const writingStyleLabel: Record<string, string> = {
  direto: 'Direto (headline objetiva, bullet points, zero rodeios)',
  educativo: 'Educativo (problema→solução, dados em destaque, autoridade)',
  provocativo: 'Provocativo (pergunta chocante, desafia o status quo)',
  empatico: 'Empático (reconhece dor do cliente, linguagem próxima)',
}

const emotionalToneLabel: Record<string, string> = {
  urgente: 'Urgente ("Apenas hoje", cor vermelha/laranja, temporalidade)',
  empolgante: 'Empolgante (exclamações, energia visual, dinamismo)',
  exclusivo: 'Exclusivo ("Acesso restrito", premium/luxo)',
  confiavel: 'Confiável (estatísticas, experiência, selos de garantia)',
}

const persuasionLabel: Record<string, string> = {
  beneficio_direto: 'Benefício direto (headline = benefício + lista de 2-3 secundários)',
  escassez: 'Escassez (vagas/unidades limitadas visualmente destacadas)',
  curiosidade: 'Curiosidade (cliffhanger, promessa de revelação no CTA)',
  prova_social: 'Prova social (número de clientes, resultados, depoimento curto)',
}

export function buildPrompt(settings: AppSettings, form: GeneratorFormData): string {
  const dimensions = form.format === 'post' ? '1080x1350px' : '1080x1920px'
  const [width, height] = form.format === 'post' ? [1080, 1350] : [1080, 1920]
  const logoBase64 = form.theme === 'dark'
    ? settings.logos.darkBackground
    : settings.logos.whiteBackground

  const logoInstruction = logoBase64
    ? `Logo fornecida — usar exatamente esta src base64 na tag <img>:\n${logoBase64}`
    : `Logo NÃO fornecida — exibir o nome da empresa "${settings.company.name}" em tipografia estilizada como substituto`

  return `${settings.aiRules}

---
## DADOS DA EMPRESA

Nome: ${settings.company.name || '(não informado)'}
Descrição: ${settings.company.description || '(não informado)'}
Website: ${settings.company.websiteUrl || '(não informado)'}
Cor primária: ${settings.colors.primary}
Cor secundária: ${settings.colors.secondary}
Cor de destaque: ${settings.colors.accent}
${logoInstruction}

---
## PARÂMETROS DO POST

Dimensão exata: ${dimensions} (body: width:${width}px; height:${height}px; overflow:hidden)
Tema: ${form.theme === 'dark' ? 'Escuro — usar gradiente com as cores da empresa' : 'Claro — fundo branco, texto escuro, destaques coloridos'}
Assunto do post: ${form.subject}
Estilo de escrita: ${writingStyleLabel[form.writingStyle] ?? 'direto'}
Tom emocional: ${emotionalToneLabel[form.emotionalTone] ?? 'empolgante'}
Técnica de persuasão: ${persuasionLabel[form.persuasionTechnique] ?? 'beneficio_direto'}
Usar imagem/arte visual: ${form.useImage ? `Sim — estilo desejado: ${form.imageStyle || 'premium, abstrato geométrico'}` : 'Não — usar apenas tipografia e gradientes'}

---
## INSTRUÇÃO FINAL

Gere EXATAMENTE ${form.variations} variação(ões) de HTML.
Cada variação deve ter um layout, copy e composição visual DIFERENTE das demais.
Separe cada variação com os marcadores exatos:
<!-- VARIACAO_START -->
[HTML completo aqui]
<!-- VARIACAO_END -->

Retorne APENAS os blocos HTML com os marcadores. Sem explicações, sem markdown, sem \`\`\`html.`
}
